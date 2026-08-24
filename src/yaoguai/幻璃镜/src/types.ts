export type Screen = 'main-menu' | 'game' | 'gallery';

export type ClueCategory = '物证' | '口供' | '星象' | '推断' | '密札';
export type ClueStatus = 'pending' | 'true' | 'false';

export interface Character {
  id: string;
  name: string;
  title?: string;
  spriteUrl?: string;
  sprites?: Record<string, string>;
  themeColor?: string;
  illustrationUrl?: string;
}

export interface DialogueLine {
  id: string;
  characterId: string;
  text: string;
  backgroundUrl?: string;
  expression?: string;
}

export interface NotificationType {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

export interface SaveSlot {
  id: string;
  timestamp: number;
  playTime: number;
  lineId: string;
  backgroundUrl: string;
}

export interface Clue {
  id: string;
  title?: string;
  text: string;
  type: 'clue' | 'deduction';
  category?: ClueCategory;
  timestamp: string;
  source: string;
  caseDocketNo?: string;
  officer?: string;
  position?: { x: number; y: number };
  status?: ClueStatus;
}

export interface GalleryCG {
  id: string;
  url: string;
  title: string;
  unlocked: boolean;
  category: 'location' | 'character';
}

export interface Preference {
  item: string;
  quote: string;
}

export interface SpriteCategory {
  id: string;
  name: string;
  url: string;
}

export interface CharacterProfile extends Character {
  description: string;
  quotes: string[];
  stats?: { label: string; value: number }[];
  likes?: Preference[];
  dislikes?: Preference[];
  secrets?: string[];
  poem?: string;
  gallerySprites?: {
    sfw: SpriteCategory[];
    nsfw: SpriteCategory[];
    chibi: SpriteCategory[];
  };
}
