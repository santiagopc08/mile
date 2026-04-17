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
        <div className="w-full h-full flex flex-col justify-center">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-500 mb-6 flex items-center gap-2">
                <Link2 className="w-3 h-3" /> Puntos de Acceso
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {predefinedLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <a 
                            key={link.name} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center justify-center p-4 border border-stone-800 bg-white/5 hover:bg-white/10 hover:border-geometric-accent transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-1 bg-stone-800" />
                            <div className="absolute top-0 right-0 w-1 h-1 bg-stone-800" />
                            <div className="absolute bottom-0 left-0 w-1 h-1 bg-stone-800" />
                            <div className="absolute bottom-0 right-0 w-1 h-1 bg-stone-800" />
                            
                            <div className={`p-2 transition-all duration-300 ${link.color} opacity-60 group-hover:opacity-100 group-hover:scale-110`}>
                                <Icon className="w-5 h-5 stroke-[1.5]" />
                            </div>
                            <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500 group-hover:text-stone-200 mt-2">
                                {link.name}
                            </span>
                        </a>
                    );
                })}
            </div>
            <div className="mt-6 pt-6 border-t border-stone-800 border-dashed">
                <p className="text-[8px] uppercase font-bold tracking-[0.1em] text-stone-600 text-center">
                    Sincronización de Enlaces: Operativa
                </p>
            </div>
        </div>
    );
}
