export type AnimeStatus = 'ongoing' | 'released';
export type BookmarkStatus = 'watching' | 'planned' | 'completed' | 'dropped';
export type AgeRating = 'none' | 'g' | 'pg' | 'pg_13' | 'r' | 'r_plus';

export interface ShikimoriAnime {
  id: number;
  name: string;
  russian: string;
  image: {
    original: string;
    preview: string;
    x96: string;
    x48: string;
  };
  url: string;
  kind: string;
  score: string;
  status: AnimeStatus;
  episodes: number;
  episodes_aired: number;
  aired_on: string;
  released_on: string;
  rating: string;
  genres: { id: number; name: string; russian: string; kind: string; }[];
  studio: { id: number; name: string; };
  description: string;
  description_html: string;
  duration: number;
  next_episode_at?: string;
}

export interface ShikimoriScreenshot {
  id: number;
  url: string;
  original: string;
  preview: string;
  x166: string;
  x332: string;
}

export interface ShikimoriCharacter {
  id: number;
  name: string;
  russian: string;
  image: {
    original: string;
    preview: string;
    x48: string;
    x80: string;
  };
  url: string;
  roles: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  shikimori_id: number;
  status: BookmarkStatus;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  shikimori_id: number;
  text: string;
  created_at: string;
  profiles?: Profile;
}
