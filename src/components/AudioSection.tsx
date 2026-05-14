'use client';

import { Music, MessageSquare, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';

interface TrackComment {
    id: string;
    author: string;
    text: string;
    track_id: string;
}

export function AudioSection() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

    const [newComment, setNewComment] = useState('');
    const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
    const [isAddingTrack, setIsAddingTrack] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newArtist, setNewArtist] = useState('');
    const [newUrl, setNewUrl] = useState('');

    if (!data || !data.audioPlaylist) return null;

    const playlist = data.audioPlaylist;

    // Default to first track if none active
    const currentTrackId = activeTrackId || (playlist.length > 0 ? playlist[0].id : null);
    const currentTrack = playlist.find(t => t.id === currentTrackId);

    const handleAddComment = async () => {
        if (newComment.trim() && currentTrack && profile) {
            const authorName = profile === 'el' ? 'Él' : 'Ella';
            const comment = {
                // eslint-disable-next-line react-hooks/purity
                id: Date.now().toString(),
                author: authorName,
                text: newComment.trim(),
                track_id: currentTrack.id
            };

            const updatedPlaylist = playlist.map(t =>
                t.id === currentTrack.id
                    ? { ...t, comments: [...(t.comments || []), comment] }
                    : t
            );

            await updateData({ audioPlaylist: updatedPlaylist });
            setNewComment('');
        }
    };

    const handleAddTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle && newUrl && profile) {
            const newTrack = {
                id: Date.now().toString(),
                title: newTitle,
                artist: newArtist,
                spotifyUrl: newUrl,
                display_order: playlist.length,
                added_by: profile,
                comments: []
            };
            await updateData({ audioPlaylist: [...playlist, newTrack] });
            setIsAddingTrack(false);
            setNewTitle('');
            setNewArtist('');
            setNewUrl('');
        }
    };

    return (
        <div id="audio" className="mx-auto w-full max-w-5xl space-y-10 bg-mosaic px-1 py-6">
            <div className="relative border border-white/10 bg-[#0a0a0a] p-8 text-center">
                <div className={`absolute left-1/2 top-0 h-[1px] w-24 -translate-x-1/2 bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
                <h2 className="mb-3 flex items-center justify-center gap-3 pt-4 text-3xl font-black uppercase tracking-normal text-white">
                    <Music className={`h-6 w-6 text-${accentClass}`} style={{ color: accentColor }} />
                    Banda Sonora
                </h2>
                <p className="mx-auto max-w-md text-sm leading-6 tracking-normal text-[#e1bfb2]">
                    Música que quiero que escuches y pienses en mí, tanto como yo pienso en ti.
                </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Playlist Sidebar */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="mb-4 flex items-center justify-between border-b border-white/10 px-2 pb-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Playlist</h3>
                        <button
                            onClick={() => setIsAddingTrack(!isAddingTrack)}
                            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-${accentClass} transition-colors hover:text-white`}
                        >
                            {isAddingTrack ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {isAddingTrack ? 'Cancelar' : 'Añadir'}
                        </button>
                    </div>

                    {isAddingTrack && (
                        <form onSubmit={handleAddTrack} className="geometric-card mb-4 animate-in space-y-3 border-white/10 bg-[#0a0a0a] p-4 fade-in slide-in-from-top-2">
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="Título" className={`w-full border border-white/10 bg-black px-3 py-2 text-sm tracking-normal text-white outline-none transition-colors placeholder:text-[#594137] focus:border-${accentClass}`} style={{ '--tw-ring-color': accentColor } as any} />
                            <input value={newArtist} onChange={e => setNewArtist(e.target.value)} placeholder="Artista" className={`w-full border border-white/10 bg-black px-3 py-2 text-sm tracking-normal text-white outline-none transition-colors placeholder:text-[#594137] focus:border-${accentClass}`} style={{ '--tw-ring-color': accentColor } as any} />
                            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} required placeholder="URL Spotify" className={`w-full border border-white/10 bg-black px-3 py-2 text-sm tracking-normal text-white outline-none transition-colors placeholder:text-[#594137] focus:border-${accentClass}`} style={{ '--tw-ring-color': accentColor } as any} />
                            <button type="submit" disabled={!newTitle || !newUrl} className={`w-full bg-${accentClass} py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:opacity-80 disabled:opacity-50`} style={{ backgroundColor: accentColor }}>Guardar</button>
                        </form>
                    )}

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {playlist.map((track) => (
                            <button
                                key={track.id}
                                onClick={() => setActiveTrackId(track.id)}
                                className={`w-full border p-4 text-left transition-all ${currentTrackId === track.id
                                    ? `border-${accentClass} bg-${accentClass}/10`
                                    : 'border-white/10 bg-[#0a0a0a] hover:border-white/25 hover:bg-[#121212]'
                                    }`} style={currentTrackId === track.id ? { borderColor: accentColor, backgroundColor: `${accentColor}1a` } : {}}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-10 w-10 items-center justify-center border ${currentTrackId === track.id ? `border-${accentClass} bg-${accentClass} text-black` : 'border-white/10 bg-black text-[#a88a7e]'
                                        }`} style={currentTrackId === track.id ? { backgroundColor: accentColor, borderColor: accentColor } : {}}>
                                        <Music className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`truncate text-sm font-bold uppercase tracking-normal ${currentTrackId === track.id ? 'text-white' : 'text-[#e1bfb2]'}`}>
                                            {track.title || 'Sin Título'}
                                        </p>
                                        <p className="truncate font-mono text-[10px] uppercase text-[#a88a7e]">{track.artist || 'Artista Desconocido'}</p>
                                    </div>
                                    {track.added_by && (
                                        <div className="flex flex-col items-center opacity-20 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-bold uppercase rotate-90">{track.added_by}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Player & Comments Area */}
                <div className="lg:col-span-3">
                    <div className="geometric-card relative flex min-h-[550px] flex-col border-white/10 bg-[#0a0a0a] p-6">
                        {/* Background Decoration */}
                        <div className={`pointer-events-none absolute right-0 top-0 h-16 w-16 border-b border-l border-${secondaryClass}/30 bg-dot-matrix opacity-50`} style={{ borderColor: `${secondaryColor}4d` }} />

                        {currentTrack ? (
                            <>
                                <div className="mb-6 z-10">
                                    {currentTrack.spotifyUrl ? (
                                        <div className="border border-white/10 bg-black p-1">
                                            <iframe
                                                style={{ borderRadius: '0px' }}
                                                src={currentTrack.spotifyUrl.replace('open.spotify.com/', 'open.spotify.com/embed/').split('?')[0]}
                                                width="100%"
                                                height="152"
                                                frameBorder="0"
                                                allowFullScreen={false}
                                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                loading="lazy"
                                            ></iframe>
                                        </div>
                                    ) : (
                                        <div className="w-full border border-white/10 bg-black p-8 text-center text-[#a88a7e]">
                                            Sin vista previa disponible.
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col z-10">
                                    <h4 className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">
                                        <MessageSquare className={`h-3 w-3 text-${secondaryClass}`} style={{ color: secondaryColor }} />
                                        Contexto
                                    </h4>

                                    <div className="flex-1 space-y-4 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {currentTrack.comments && currentTrack.comments.length > 0 ? (
                                            currentTrack.comments.map((comment: TrackComment) => (
                                                <div key={comment.id} className={`border-l-2 border-${accentClass} bg-black p-4`} style={{ borderColor: accentColor }}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${comment.author === 'Ella' ? 'text-user-a' : 'text-user-b'}`}>
                                                            {comment.author}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-light tracking-normal text-[#e5e2e1]">
                                                        &quot;{comment.text}&quot;
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-[#a88a7e] opacity-50">
                                                <MessageSquare className="w-8 h-8 mb-2" />
                                                <p className="text-[10px] uppercase tracking-widest">Sin comentarios</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto border-t border-white/10 pt-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                                placeholder={`Añadir nota como ${profile === 'ella' ? 'ella' : 'él'}...`}
                                                className={`flex-1 border border-white/10 bg-black px-4 py-3 text-sm tracking-normal text-white outline-none transition-colors placeholder:text-[#594137] focus:border-${accentClass}`} style={{ '--tw-ring-color': accentColor } as any}
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                                className={`bg-${accentClass} px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:opacity-80 disabled:opacity-50`} style={{ backgroundColor: accentColor }}
                                            >
                                                Enviar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center font-light text-[#a88a7e] opacity-60">
                                <Music className="w-12 h-12 mb-4" />
                                <p className="uppercase text-[10px] tracking-[0.2em]">Playlist vacía</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
