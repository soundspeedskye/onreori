export type FetchInit = RequestInit & {
  redirect?: 'manual';
  headers?: Record<string, string>;
};

export type EventUrlPreview = {
  url: string;
  title?: string;
  description?: string;
  dateCandidates: string[];
  locationCandidates: string[];
  confidence: 'high' | 'medium' | 'low';
};
