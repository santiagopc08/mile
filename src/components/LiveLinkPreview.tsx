'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface LiveLinkPreviewProps {
    url: string;
    label?: string;
}

export function LiveLinkPreview({ url, label = 'VISTA PREVIA EN VIVO' }: LiveLinkPreviewProps) {
    const [debouncedUrl, setDebouncedUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [isValid, setIsValid] = useState(false);

    // 1. Client-Side Sanitization & Debounce Keystrokes
    useEffect(() => {
        const handler = setTimeout(() => {
            const trimmed = url.trim();
            if (!trimmed) {
                setDebouncedUrl('');
                setIsValid(false);
                setPreview(null);
                return;
            }

            // Quick client-side check: Must contain a dot and not contain spaces
            // This screens out plain-text addresses like "Calle 54 #50-88 villa paula"
            const isLikeUrl = trimmed.includes('.') && !trimmed.includes(' ');
            if (!isLikeUrl) {
                setIsValid(false);
                setPreview(null);
                return;
            }

            // Normalize URL format
            let normalized = trimmed;
            if (!/^https?:\/\//i.test(trimmed)) {
                normalized = `https://${trimmed}`;
            }

            try {
                // Validate if it is a valid URL object constructor
                new URL(normalized);
                setDebouncedUrl(normalized);
                setIsValid(true);
            } catch {
                setIsValid(false);
                setPreview(null);
            }
        }, 600); // 600ms matches WhatsApp's natural typing pause

        return () => clearTimeout(handler);
    }, [url]);

    // 2. Fetch Link Preview for Validated Debounced URL
    useEffect(() => {
        if (!debouncedUrl || !isValid) {
            setPreview(null);
            return;
        }

        const fetchPreview = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/link-preview?url=${encodeURIComponent(debouncedUrl)}`);
                if (res.ok) {
                    const data = await res.json();
                    setPreview(data);
                } else {
                    setPreview(null);
                }
            } catch (err) {
                console.error("Failed to fetch live link preview:", err);
                setPreview(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [debouncedUrl, isValid]);

    // 3. Render States
    if (!url.trim() || !isValid) return null;

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2 border border-white/5 bg-[#0a0a0a]/50 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#a88a7e]"
            >
                <Loader2 className="h-3 w-3 animate-spin text-[#00dbe9]" />
                <span>Cargando vista previa del enlace...</span>
            </motion.div>
        );
    }

    if (!preview) return null;

    let domain = 'ENLACE';
    try {
        domain = new URL(preview.url || debouncedUrl).hostname.replace('www.', '').toUpperCase();
    } catch {}

    return (
        <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 border border-white/10 bg-[#070707] p-3 font-mono text-[#e5e2e1] flex flex-col sm:flex-row gap-3 relative overflow-hidden select-none"
        >
            {/* Absolute badge */}
            <div className="absolute top-0 right-0 bg-[#00dbe9]/10 text-[#00dbe9] text-[7px] font-black uppercase px-2.5 py-0.5 border-b border-l border-white/10 tracking-widest">
                {label}
            </div>

            {/* Thumbnail */}
            <div className="w-full sm:w-24 h-16 border border-white/10 bg-black overflow-hidden shrink-0 flex items-center justify-center relative group">
                {preview.image ? (
                    <img 
                        src={preview.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                ) : (
                    <ImageIcon className="w-5 h-5 text-white/15" />
                )}
            </div>

            {/* Text Metadata */}
            <div className="flex flex-col justify-center min-w-0 pr-16 py-0.5">
                <span className="text-[7px] font-black text-[#00dbe9] uppercase tracking-widest mb-0.5">
                    {preview.siteName || domain}
                </span>
                <h6 className="text-[10px] font-black uppercase tracking-tight text-white line-clamp-1 leading-normal">
                    {preview.title || 'Enlace Detectado'}
                </h6>
                {preview.description && (
                    <p className="text-[8px] text-white/45 line-clamp-1 italic mt-0.5">
                        {preview.description}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
