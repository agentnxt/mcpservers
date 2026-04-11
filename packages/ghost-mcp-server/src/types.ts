export interface GhostTag {
  name: string;
}

export interface GhostPostInput {
  title: string;
  html?: string;
  mobiledoc?: string;
  status?: string;
  tags?: GhostTag[];
  featured?: boolean;
  excerpt?: string;
  published_at?: string;
}

export interface GhostPostUpdate {
  updated_at: string;
  title?: string;
  html?: string;
  status?: string;
  tags?: GhostTag[];
  featured?: boolean;
  excerpt?: string;
}
