import { create } from 'zustand';
import type { LogMessage } from '../api';

export interface LogEntry extends LogMessage {
  id: number;
}

interface LogState {
  logs: LogEntry[];
  autoScroll: boolean;
  selectedLevels: Set<string>;
  searchText: string;
  searchIndex: number;
  searchMatches: number[];

  addLog: (msg: LogMessage) => void;
  addSystemLogs: (msgs: LogMessage[]) => void;
  clearLogs: () => void;
  setAutoScroll: (v: boolean) => void;
  toggleLevel: (level: string) => void;
  setSearchText: (text: string) => void;
  setSearchIndex: (idx: number) => void;
  setSearchMatches: (matches: number[]) => void;
}

let logIdCounter = 0;

const DEFAULT_LEVELS = new Set(['I', 'W', 'E', 'F']);

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  autoScroll: true,
  selectedLevels: new Set(DEFAULT_LEVELS),
  searchText: '',
  searchIndex: -1,
  searchMatches: [],

  addLog: (msg) =>
    set((state) => ({
      logs: [...state.logs, { ...msg, id: ++logIdCounter }],
    })),

  addSystemLogs: (msgs) =>
    set((state) => {
      const newEntries = msgs.map((m) => ({ ...m, id: ++logIdCounter }));
      const all = [...state.logs, ...newEntries];
      all.sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));
      return { logs: all };
    }),

  clearLogs: () => set({ logs: [], searchMatches: [], searchIndex: -1 }),

  setAutoScroll: (v) => set({ autoScroll: v }),

  toggleLevel: (level) =>
    set((state) => {
      const next = new Set(state.selectedLevels);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return { selectedLevels: next };
    }),

  setSearchText: (text) => set({ searchText: text, searchIndex: -1, searchMatches: [] }),
  setSearchIndex: (idx) => set({ searchIndex: idx }),
  setSearchMatches: (matches) => set({ searchMatches: matches }),
}));
