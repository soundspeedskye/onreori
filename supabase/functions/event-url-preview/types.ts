export type FetchInit = RequestInit & {
  redirect?: 'manual';
  headers?: Record<string, string>;
};

export type {
  ParsedEventUrlPreview as EventUrlPreview,
} from '../../../src/utils/eventUrlPreviewParser.ts';
