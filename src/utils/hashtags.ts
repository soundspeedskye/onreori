import type {ChatMessage} from '../types';

const HASHTAG_PATTERN = /#([0-9A-Za-z_가-힣]+)/g;

export function extractHashtags(body: string): string[] {
  const tags = new Set<string>();

  for (const match of body.matchAll(HASHTAG_PATTERN)) {
    tags.add(match[1]);
  }

  return Array.from(tags);
}

export function filterMessagesByHashtag<T extends ChatMessage>(
  messages: T[],
  rawTag: string,
): T[] {
  const tag = rawTag.replace(/^#/, '');

  if (!tag) {
    return messages;
  }

  return messages.filter(message => message.hashtags?.includes(tag));
}
