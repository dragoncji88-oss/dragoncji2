export interface Student {
  id: string;
  name: string;
}

export interface PickHistoryItem {
  id: string;
  name: string;
  order: number;
  timestamp: string;
}

export interface PresetRoster {
  id: string;
  title: string;
  description: string;
  students: string[];
}
