import React from 'react';

export const renderTextWithHashtags = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[\w\dÀ-ÿ\u00f1\u00d1]+)/g);
    return parts.map((part, index) => {
        if (part.startsWith('#')) {
            return (
                <span key={index} className="font-mono text-user-c font-bold tracking-wider mx-0.5">
                    {part}
                </span>
            );
        }
        return part;
    });
};
