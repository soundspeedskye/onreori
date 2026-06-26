import {useCallback, useEffect, useRef, useState} from 'react';

import {
  ensureTutorialWelcomeMessages,
  isTutorialRoomId,
  listMessages,
  subscribeToRoomMessages,
  type TutorialRoomCopy,
} from '../../services/rooms';
import type {ChatMessage} from '../../types';
import {ALERT_MESSAGES, showError} from '../../utils/appAlert';
import {
  mergeMessagesByCreatedAt,
  mergeRoomMessagesByCreatedAt,
} from '../../utils/chatMessages';

const REALTIME_MESSAGE_BATCH_MS = 80;
const TUTORIAL_BOT_TYPING_DELAY_MS = 700;

export function useRoomMessages(
  roomId: string,
  enabled: boolean,
  tutorialCopy?: TutorialRoomCopy,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [botTyping, setBotTyping] = useState(false);
  const tutorialBotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const realtimeMessageBatchRef = useRef<ChatMessage[]>([]);
  const realtimeBatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  function clearTutorialBotTimers() {
    tutorialBotTimersRef.current.forEach(timer => clearTimeout(timer));
    tutorialBotTimersRef.current = [];
  }

  function clearRealtimeMessageBatch() {
    if (realtimeBatchTimerRef.current) {
      clearTimeout(realtimeBatchTimerRef.current);
      realtimeBatchTimerRef.current = null;
    }
    realtimeMessageBatchRef.current = [];
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    const tutorialRoom = isTutorialRoomId(roomId);

    setLoading(true);
    setBotTyping(false);
    clearTutorialBotTimers();
    clearRealtimeMessageBatch();
    setMessages(current => current.filter(message => message.roomId === roomId));

    function scheduleTutorialWelcomeMessages() {
      setBotTyping(true);
      const timer = setTimeout(async () => {
        try {
          const welcomeMessages = await ensureTutorialWelcomeMessages(
            roomId,
            tutorialCopy,
          );
          if (active) {
            setMessages(current =>
              mergeRoomMessagesByCreatedAt(roomId, current, ...welcomeMessages),
            );
          }
        } finally {
          if (active) {
            setBotTyping(false);
          }
        }
      }, TUTORIAL_BOT_TYPING_DELAY_MS);

      tutorialBotTimersRef.current.push(timer);
    }

    async function load() {
      try {
        const nextMessages = await listMessages(roomId);
        if (active) {
          setMessages(current =>
            mergeRoomMessagesByCreatedAt(roomId, current, ...nextMessages),
          );

          if (tutorialRoom) {
            if (nextMessages.length === 0) {
              scheduleTutorialWelcomeMessages();
            } else {
              const localizedMessages = await ensureTutorialWelcomeMessages(
                roomId,
                tutorialCopy,
              );
              if (active) {
                setMessages(current =>
                  mergeRoomMessagesByCreatedAt(
                    roomId,
                    current,
                    ...localizedMessages,
                  ),
                );
              }
            }
          }
        }
      } catch (error) {
        showError(error, {
          title: ALERT_MESSAGES.loadFailed,
          fallbackMessage: ALERT_MESSAGES.retry,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    const unsubscribe = subscribeToRoomMessages(roomId, message => {
      if (message.roomId !== roomId) {
        return;
      }

      realtimeMessageBatchRef.current.push(message);

      if (realtimeBatchTimerRef.current) {
        return;
      }

      realtimeBatchTimerRef.current = setTimeout(() => {
        const pendingMessages = realtimeMessageBatchRef.current;
        realtimeMessageBatchRef.current = [];
        realtimeBatchTimerRef.current = null;

        if (!active || pendingMessages.length === 0) {
          return;
        }

        setMessages(current =>
          mergeRoomMessagesByCreatedAt(roomId, current, ...pendingMessages),
        );
      }, REALTIME_MESSAGE_BATCH_MS);
    });

    return () => {
      active = false;
      clearTutorialBotTimers();
      clearRealtimeMessageBatch();
      unsubscribe();
    };
  }, [enabled, roomId, tutorialCopy]);

  const scheduleTutorialReply = useCallback(
    (replyFactory: () => Promise<ChatMessage>) => {
      setBotTyping(true);
      const timer = setTimeout(async () => {
        try {
          const botReply = await replyFactory();
          setMessages(current => mergeMessagesByCreatedAt(current, botReply));
        } finally {
          setBotTyping(false);
        }
      }, TUTORIAL_BOT_TYPING_DELAY_MS);
      tutorialBotTimersRef.current.push(timer);
    },
    [],
  );

  return {
    messages,
    setMessages,
    loading,
    botTyping,
    scheduleTutorialReply,
  };
}
