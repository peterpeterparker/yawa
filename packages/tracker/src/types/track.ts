// Duplicate Pick<SetTrackEventRequest, 'name' | 'metadata'> to avoid
// exposing api.ts types to the consumers.

export interface TrackEvent {
  name: string;
  metadata?: Record<string, string>;
}
