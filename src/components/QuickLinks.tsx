'use client';

import { Globe, GraduationCap, Github, Mail, Figma, Link2 } from 'lucide-react';

export function QuickLinks() {
    const predefinedLinks = [
        { name: 'Canvas', url: 'https://canvas.instructure.com', icon: GraduationCap, color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
        { name: 'Notion', url: 'https://notion.so', icon: Globe, color: 'text-stone-300', bg: 'bg-white/10' },
        { name: 'Github', url: 'https://github.com', icon: Github, color: 'text-white', bg: 'bg-white/10' },
        { name: 'Gmail', url: 'https://mail.google.com', icon: Mail, color: 'text-rose-400', bg: 'bg-rose-400/10' },
        { name: 'Figma', url: 'https://figma.com', icon: Figma, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    ];

    return (
        <div className="glass-panel rounded-3xl p-6 h-full flex flex-col justify-between">
            <div>
                <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Link2 className="w-4 h-4" /> Enlaces Rápidos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {predefinedLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <a 
                                key={link.name} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95 group`}
                            >
                                <div className={`p-2 rounded-xl ${link.bg} ${link.color} mb-2 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] uppercase tracking-wider font-medium text-stone-400 group-hover:text-stone-200">
                                    {link.name}
                                </span>
                            </a>
                        );
                    })}
                </div>
            </div>
            <p className="text-xs text-stone-500 font-light text-center mt-4 opacity-50">
                Puedes personalizar estos enlaces en el código.
            </p>
        </div>
    );
}
