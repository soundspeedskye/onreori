import type {Dispatch, SetStateAction} from 'react';
import {useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';

import {
  createTutorialBotReply,
  isTutorialRoomId,
  sendImageMessage,
  sendTextMessage,
} from '../../services/rooms';
import type {AuthUser, ChatMessage} from '../../types';
import {ALERT_MESSAGES, showAlert, showError} from '../../utils/appAlert';
import {mergeMessagesByCreatedAt} from '../../utils/chatMessages';

type UseChatSendActionsParams = {
  roomId: string;
  user: AuthUser | null;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  scheduleTutorialReply: (replyFactory: () => Promise<ChatMessage>) => void;
};

export function useChatSendActions({
  roomId,
  user,
  setMessages,
  scheduleTutorialReply,
}: UseChatSendActionsParams) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendText = async () => {
    if (!user || sending) {
      return;
    }

    try {
      setSending(true);
      const message = await sendTextMessage(roomId, body, user);
      setMessages(current => mergeMessagesByCreatedAt(current, message));
      setBody('');
      if (isTutorialRoomId(roomId)) {
        scheduleTutorialReply(() => createTutorialBotReply(roomId));
      }
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.sendFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async () => {
    if (!user || sending) {
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    const asset = result.assets?.[0];

    if (!asset?.uri) {
      showAlert({title: ALERT_MESSAGES.loadFailed});
      return;
    }

    try {
      setSending(true);
      const message = await sendImageMessage({
        roomId,
        user,
        imageUri: asset.uri,
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        contentType: asset.type ?? 'image/jpeg',
      });
      setMessages(current => mergeMessagesByCreatedAt(current, message));
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.sendFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setSending(false);
    }
  };

  return {
    body,
    setBody,
    sending,
    handleSendText,
    handleSendImage,
  };
}
