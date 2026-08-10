import type { EventComment } from '@/services/storeService';

export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    imageUrl?: string;
    author?: string;
    tags?: string[];
    reactions?: Record<string, string[]>;
    comments?: EventComment[];
}
