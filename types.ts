
export type FormatType = 'Photo' | 'Photo+Text' | 'Video' | 'FAQ' | 'Quote';

export interface DayPlan {
  id: number;
  dayIndex: number;
  dayOfWeek: string;
  weekTheme: string;
  title: string;
  format: FormatType;
  content: string; // Shot list or content notes
  caption: string;
  image?: string; // base64 string
}

export interface PlannerConfig {
  month: string;
  mainTheme: string;
  daysCount: 30 | 31;
  weekThemes: string[];
  videoFrequency: 'Saturdays' | 'TwiceAWeek';
}

export enum ViewState {
  CREATE = 'create',
  EDIT = 'edit',
  EXPORT = 'export'
}
