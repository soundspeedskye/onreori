import type {ChatMessage} from '../types';
import {filterMessagesByHashtag} from './hashtags';

export type ChatMessagePresentation = {
  isMine: boolean;
  showNickname: boolean;
  showTime: boolean;
  timeLabel: string;
};

export type MessageStateUpdater = (
  updater: (currentMessages: ChatMessage[]) => ChatMessage[],
) => void;

export function getChatMessageMinuteKey(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt.slice(0, 16);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function formatChatMessageTime(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function getChatMessagePresentation(
  messages: ChatMessage[],
  index: number,
  currentUserId: string | undefined,
): ChatMessagePresentation {
  const message = messages[index];
  const previousMessage = index > 0 ? messages[index - 1] : undefined;
  const isMine = message.userId === currentUserId;
  const sameAuthor = previousMessage?.userId === message.userId;
  const sameMinute =
    sameAuthor &&
    previousMessage !== undefined &&
    getChatMessageMinuteKey(previousMessage.createdAt) ===
      getChatMessageMinuteKey(message.createdAt);

  return {
    isMine,
    showNickname: !isMine && !sameAuthor,
    showTime: !sameAuthor || !sameMinute,
    timeLabel: formatChatMessageTime(message.createdAt),
  };
}

export function mergeMessagesByCreatedAt(
  currentMessages: ChatMessage[],
  ...incomingMessages: ChatMessage[]
): ChatMessage[] {
  const messagesById = new Map(
    currentMessages.map(message => [message.id, message]),
  );

  incomingMessages.forEach(message => {
    const existingMessage = messagesById.get(message.id);

    if (!existingMessage) {
      messagesById.set(message.id, message);
      return;
    }

    if (
      message.type === 'image' &&
      message.mediaUrl &&
      existingMessage.mediaUrl !== message.mediaUrl
    ) {
      messagesById.set(message.id, {
        ...existingMessage,
        mediaUrl: message.mediaUrl,
      });
    }
  });

  return Array.from(messagesById.values()).sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

export function mergeRoomMessagesByCreatedAt(
  roomId: string,
  currentMessages: ChatMessage[],
  ...incomingMessages: ChatMessage[]
): ChatMessage[] {
  return mergeMessagesByCreatedAt(
    currentMessages.filter(message => message.roomId === roomId),
    ...incomingMessages.filter(message => message.roomId === roomId),
  );
}

export function getVisibleMessagesForHashtagFilter(
  messages: ChatMessage[],
  filter: string,
): ChatMessage[] {
  const normalizedFilter = filter.trim();

  return normalizedFilter
    ? filterMessagesByHashtag(messages, normalizedFilter)
    : messages;
}

export function appendRealtimeMessageIfActive(
  isActive: boolean,
  updateMessages: MessageStateUpdater,
  message: ChatMessage,
): void {
  if (!isActive) {
    return;
  }

  updateMessages(current => mergeMessagesByCreatedAt(current, message));
}
