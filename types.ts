export interface TextBlock {
  id: string;
  text: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  order?: number;
}

export interface ComicPageData {
  id: string;
  filename: string;
  imageUrl: string; // Blob URL
  width: number;
  height: number;
  analyzed: boolean;
  blocks: TextBlock[];
}

export enum ReadingMode {
  WEBTOON = 'WEBTOON', // Top to Bottom
  MANGA = 'MANGA', // Right to Left, Top to Bottom
}

export interface AnalysisResponse {
  bubbles: {
    text: string;
    box_2d: [number, number, number, number];
  }[];
}

export interface AppSettings {
  ttsRate: number;
  ttsPitch: number;
  ttsVoiceURI: string | null;
  defaultReadingMode: ReadingMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVoiceURI: null,
  defaultReadingMode: ReadingMode.MANGA,
};