'use client';

import { Music, MessageSquare, User, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';

export function AudioSection() {
    const { data, updateData } = useStore();
    const { profile } = useProfile();
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
        <div id="audio" className="w-full max-w-5xl mx-auto space-y-12 py-12 px-4 bg-grid-mosaic">
            <div className="text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-geometric-accent opacity-50" />
                <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-3 flex items-center justify-center gap-3 uppercase tracking-tighter pt-4">
                    <Music className="w-6 h-6 text-geometric-accent" />
                    Banda Sonora
                </h2>
                <p className="text-stone-500 dark:text-stone-400 font-light max-w-md mx-auto italic">
                    Música que quiero que escuches y pienses en mí, tanto como yo pienso en ti.
                </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Playlist Sidebar */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2 mb-4 border-b border-geometric-border pb-2">
                        <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Playlist</h3>
                        <button
                            onClick={() => setIsAddingTrack(!isAddingTrack)}
                            className="text-[10px] font-bold text-geometric-accent uppercase tracking-wider hover:text-stone-900 dark:hover:text-white transition-colors flex items-center gap-1"
                        >
                            {isAddingTrack ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {isAddingTrack ? 'Cancelar' : 'Añadir'}
                        </button>
                    </div>

                    {isAddingTrack && (
                        <form onSubmit={handleAddTrack} className="geometric-card bg-white dark:bg-stone-900 p-4 mb-4 animate-in fade-in slide-in-from-top-2 space-y-3">
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="Título" className="w-full bg-stone-50 dark:bg-stone-950 border border-geometric-border rounded-none px-3 py-2 text-sm outline-none focus:border-geometric-accent transition-colors" />
                            <input value={newArtist} onChange={e => setNewArtist(e.target.value)} placeholder="Artista" className="w-full bg-stone-50 dark:bg-stone-950 border border-geometric-border rounded-none px-3 py-2 text-sm outline-none focus:border-geometric-accent transition-colors" />
                            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} required placeholder="URL Spotify" className="w-full bg-stone-50 dark:bg-stone-950 border border-geometric-border rounded-none px-3 py-2 text-sm outline-none focus:border-geometric-accent transition-colors" />
                            <button type="submit" disabled={!newTitle || !newUrl} className="w-full py-2 text-xs font-bold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-none uppercase tracking-widest hover:bg-geometric-accent dark:hover:bg-geometric-accent dark:hover:text-white transition-colors disabled:opacity-50">Guardar</button>
                        </form>
                    )}

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {playlist.map((track) => (
                            <button
                                key={track.id}
                                onClick={() => setActiveTrackId(track.id)}
                                className={`w-full text-left p-4 rounded-none transition-all border ${currentTrackId === track.id
                                    ? 'bg-white dark:bg-stone-900 border-geometric-accent'
                                    : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-stone-900/50 hover:border-geometric-border'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-none flex items-center justify-center border ${currentTrackId === track.id ? 'bg-geometric-accent text-white border-geometric-accent' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-geometric-border'
                                        }`}>
                                        <Music className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold truncate text-sm uppercase tracking-tight ${currentTrackId === track.id ? 'text-stone-900 dark:text-white' : 'text-stone-600 dark:text-stone-400'}`}>
                                            {track.title || 'Sin Título'}
                                        </p>
                                        <p className="text-[10px] text-stone-400 truncate uppercase font-mono">{track.artist || 'Artista Desconocido'}</p>
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
                    <div className="geometric-card bg-white dark:bg-stone-900 p-6 min-h-[550px] flex flex-col relative">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-dot-matrix opacity-[0.05] pointer-events-none" />

                        {currentTrack ? (
                            <>
                                <div className="mb-6 z-10">
                                    {currentTrack.spotifyUrl ? (
                                        <div className="border border-geometric-border p-1 bg-stone-50 dark:bg-stone-950">
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
                                        <div className="w-full bg-stone-50 dark:bg-stone-800 border border-geometric-border p-8 text-center text-stone-400 font-light italic">
                                            Sin vista previa disponible.
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col z-10">
                                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-6 border-b border-geometric-border pb-4">
                                        <MessageSquare className="w-3 h-3 text-geometric-accent" />
                                        Contexto
                                    </h4>

                                    <div className="flex-1 space-y-4 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {currentTrack.comments && currentTrack.comments.length > 0 ? (
                                            currentTrack.comments.map((comment: any) => (
                                                <div key={comment.id} className="border-l-2 border-geometric-accent bg-stone-50 dark:bg-stone-950/40 p-4">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${comment.author === 'Ella' ? 'text-rose-500' : 'text-amber-500'}`}>
                                                            {comment.author}
                                                        </span>
                                                    </div>
                                                    <p className="text-stone-600 dark:text-stone-300 text-sm italic font-light">
                                                        &quot;{comment.text}&quot;
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                                <MessageSquare className="w-8 h-8 mb-2" />
                                                <p className="text-[10px] uppercase tracking-widest">Sin comentarios</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-geometric-border">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                                placeholder={`Añadir nota como ${profile === 'el' ? 'él' : 'ella'}...`}
                                                className="flex-1 bg-stone-50 dark:bg-stone-800 border border-geometric-border rounded-none px-4 py-3 outline-none focus:border-geometric-accent text-sm transition-colors"
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                                className="px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-none font-bold text-xs uppercase tracking-widest transition-colors hover:bg-geometric-accent dark:hover:bg-geometric-accent hover:text-white disabled:opacity-50"
                                            >
                                                Enviar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 font-light italic p-10 text-center opacity-50">
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
