'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    imageUrl?: string;
}

interface TimelineProps {
    events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
    return (
        <div className="relative py-10 w-full">
            {/* Central Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-200 dark:bg-stone-800 -translate-x-1/2" />

            <div className="space-y-24">
                {events.map((event, index) => {
                    const isLeft = index % 2 === 0;

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`relative flex items-center justify-between w-full ${isLeft ? 'flex-row-reverse' : ''
                                }`}
                        >
                            {/* Timeline dot */}
                            <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-earth-base dark:bg-earth-soft border-4 border-stone-50 dark:border-stone-950 z-10" />

                            {/* Empty space for opposite side */}
                            <div className="w-5/12" />

                            {/* Content Card */}
                            <div className={`w-5/12 ${isLeft ? 'text-right' : 'text-left'}`}>
                                <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-3 ${isLeft ? 'justify-end' : 'justify-start'}`}>
                                        <Calendar className="w-4 h-4" />
                                        <time>{event.date}</time>
                                    </div>
                                    <h3 className="text-xl font-medium text-stone-800 dark:text-stone-200 mb-2">
                                        {event.title}
                                    </h3>
                                    <p className="text-stone-600 dark:text-stone-400 font-light leading-relaxed">
                                        {event.description}
                                    </p>

                                    {event.imageUrl && (
                                        <div className="mt-4 rounded-xl overflow-hidden min-h-32 bg-stone-100 dark:bg-stone-800">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
