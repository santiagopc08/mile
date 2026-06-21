import { type ChecklistItem } from '@/services/storeService';

export interface Task {
  id: string;
  objective_id?: string;
  text: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped';
  category: 'work' | 'home' | 'personal';
  priority?: 'low' | 'medium' | 'high';
  estimated_time: number;
  actual_time: number;
  due_date?: string;
  updated_at: string;
  actions?: ChecklistItem[];
  validations?: ChecklistItem[];
  detail?: string;
  assignee?: 'el' | 'ella';
}

export interface Objective {
  id: string;
  title: string;
  author: string;
  is_complete?: boolean;
  last_active: string;
  created_at: string;
}

export const categoryStyles: Record<Task['category'], { label: string; chip: string; active: string; stripe: string }> = {
  work: {
    label: 'TRABAJO',
    chip: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
    active: 'border-cyan-400 bg-cyan-400 text-black',
    stripe: 'bg-cyan-400'
  },
  home: {
    label: 'CASA',
    chip: 'border-user-b/40 bg-user-b/10 text-user-b',
    active: 'border-user-b bg-user-b text-black',
    stripe: 'bg-user-b'
  },
  personal: {
    label: 'PERSONAL',
    chip: 'border-user-a/40 bg-user-a/10 text-user-a',
    active: 'border-user-a bg-user-a text-black',
    stripe: 'bg-user-a'
  }
};

export const priorityStyles: Record<NonNullable<Task['priority']>, { label: string; active: string; chip: string; stripe: string; text: string }> = {
  low: {
    label: 'BAJA',
    active: 'border-sky-400 bg-sky-400 text-black',
    chip: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
    stripe: 'bg-sky-400',
    text: 'text-sky-200'
  },
  medium: {
    label: 'MEDIA',
    active: 'border-amber-400 bg-amber-400 text-black',
    chip: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    stripe: 'bg-amber-400',
    text: 'text-amber-200'
  },
  high: {
    label: 'ALTA',
    active: 'border-rose-400 bg-rose-400 text-black',
    chip: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
    stripe: 'bg-rose-400',
    text: 'text-rose-200'
  }
};
