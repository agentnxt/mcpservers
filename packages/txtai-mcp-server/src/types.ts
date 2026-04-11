export interface TxtaiDocument {
  id: string;
  text: string;
}

export interface TxtaiSearchResult {
  id: string;
  score: number;
  text?: string;
}
