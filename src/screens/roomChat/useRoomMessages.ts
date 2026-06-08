import {useEffect, useRef, useState} from 'react';

import {
  ensureTutorialWelcomeMessages,
  isTutorialRoomId,
  listMessages,
  subscribeToRoomMessages,
} from '../../services/rooms';
import type {ChatMessage} from '../../types';
import {ALERT_MESSAGES, showError} from '../../utils/appAlert';
import {
  appendRealtimeMessageIfActive,
  mergeMessagesByCreatedAt,
  mergeRoomMessagesByCreatedAt,
} from '../../utils/chatMessages';

const TUTORIAL_BOT_TYPING_DELAY_MS = 700;

export function useRoomMessages(roomId: string, enabled: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [botTyping, setBotTyping] = useState(false);
  const tutorialBotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTutorialBotTimers() {
    tutorialBotTimersRef.current.forEach(timer => clearTimeout(timer));
    tutorialBotTimersRef.current = [];
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
    setMessages(current => current.filter(message => message.roomId === roomId));

    function scheduleTutorialWelcomeMessages() {
      setBotTyping(true);
      const timer = setTimeout(async () => {
        try {
          const welcomeMessages = await ensureTutorialWelcomeMessages(roomId);
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

          if (tutorialRoom && nextMessages.length === 0) {
            scheduleTutorialWelcomeMessages();
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
      if (message.roomId === roomId) {
        appendRealtimeMessageIfActive(active, setMessages, message);
      }
    });

    return () => {
      active = false;
      clearTutorialBotTimers();
      unsubscribe();
    };
  }, [enabled, roomId]);

  function scheduleTutorialReply(replyFactory: () => Promise<ChatMessage>) {
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
  }

  return {
    messages,
    setMessages,
    loading,
    botTyping,
    scheduleTutorialReply,
  };
}
