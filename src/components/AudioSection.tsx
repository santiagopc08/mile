'use client';

import { Music, MessageSquare, User } from 'lucide-react';
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
        <div id="audio" className="w-full max-w-5xl mx-auto space-y-12">
            <div className="text-center">
                <h2 className="text-3xl font-light text-stone-800 dark:text-stone-200 mb-3 flex items-center justify-center gap-3">
                    <Music className="w-6 h-6 text-earth-base" />
                    Nuestra Banda Sonora
                </h2>
                <p className="text-stone-500 dark:text-stone-400 font-light max-w-md mx-auto">
                    Música que quiero que escuches y pienses en mí, tanto como yo pienso en ti.
                </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Playlist Sidebar */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest">Playlist</h3>
                        <button onClick={() => setIsAddingTrack(!isAddingTrack)} className="text-[10px] font-bold text-earth-base uppercase tracking-wider bg-earth-50 dark:bg-earth-900/20 px-3 py-1.5 rounded-full hover:bg-earth-100 transition-colors">
                            + Añadir Canción
                        </button>
                    </div>

                    {isAddingTrack && (
                        <form onSubmit={handleAddTrack} className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-earth-200 dark:border-earth-800/30 mb-4 animate-in fade-in slide-in-from-top-2 shadow-sm space-y-3">
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="Título de la canción" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-earth-base" />
                            <input value={newArtist} onChange={e => setNewArtist(e.target.value)} placeholder="Artista (opcional)" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-earth-base" />
                            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} required placeholder="URL de Spotify" className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-earth-base" />
                            <div className="flex gap-2 mt-2">
                                <button type="button" onClick={() => setIsAddingTrack(false)} className="flex-1 py-2 text-xs font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={!newTitle || !newUrl} className="flex-1 py-2 text-xs font-medium text-white bg-earth-base disabled:opacity-50 rounded-lg shadow-sm">Guardar</button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {playlist.map((track) => (
                            <button
                                key={track.id}
                                onClick={() => setActiveTrackId(track.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${currentTrackId === track.id
                                    ? 'bg-white dark:bg-stone-900 border-earth-accent shadow-sm'
                                    : 'bg-transparent border-transparent hover:bg-stone-100 dark:hover:bg-stone-900/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentTrackId === track.id ? 'bg-earth-base text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                                        }`}>
                                        <Music className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${currentTrackId === track.id ? 'text-stone-900 dark:text-white' : 'text-stone-600 dark:text-stone-400'}`}>
                                            {track.title || 'Sin Título'}
                                        </p>
                                        <p className="text-xs text-stone-400 truncate">{track.artist || 'Artista Desconocido'}</p>
                                    </div>
                                    {track.added_by && (
                                        <div className="flex flex-col items-center opacity-40">
                                            <User className="w-3 h-3" />
                                            <span className="text-[8px] uppercase">{track.added_by}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Player & Comments Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-6 shadow-sm min-h-[600px] flex flex-col">
                        {currentTrack ? (
                            <>
                                <div className="mb-6">
                                    {currentTrack.spotifyUrl ? (
                                        <iframe
                                            style={{ borderRadius: '12px' }}
                                            src={currentTrack.spotifyUrl.replace('open.spotify.com/', 'open.spotify.com/embed/').split('?')[0]}
                                            width="100%"
                                            height="152"
                                            frameBorder="0"
                                            allowFullScreen={false}
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            loading="lazy"
                                        ></iframe>
                                    ) : (
                                        <div className="w-full bg-stone-50 dark:bg-stone-800 rounded-2xl p-8 text-center text-stone-400 font-light italic">
                                            Sin vista previa de Spotify disponible.
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h4 className="flex items-center gap-2 text-sm font-medium text-stone-500 uppercase tracking-widest mb-6 border-b border-stone-100 dark:border-stone-800 pb-4">
                                        <MessageSquare className="w-4 h-4" />
                                        Por qué la elegimos
                                    </h4>

                                    <div className="flex-1 space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {currentTrack.comments && currentTrack.comments.length > 0 ? (
                                            currentTrack.comments.map((comment: any) => (
                                                <div key={comment.id} className="bg-stone-50 dark:bg-stone-950/40 p-4 rounded-xl">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${comment.author === 'Ella' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                            {comment.author}
                                                        </span>
                                                    </div>
                                                    <p className="text-stone-600 dark:text-stone-300 text-sm italic">
                                                        &quot;{comment.text}&quot;
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-stone-400 py-10 font-light italic text-sm">Nadie ha comentado esta canción aún...</p>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-800">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                                placeholder={`Comentar como ${profile === 'el' ? 'él' : 'ella'}...`}
                                                className="flex-1 bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-earth-base text-sm"
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                                className="px-6 py-3 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-xl font-medium transition-colors hover:bg-stone-700 disabled:opacity-50"
                                            >
                                                Enviar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 font-light italic p-10 text-center">
                                <Music className="w-12 h-12 mb-4 opacity-20" />
                                <p>No hay canciones en la playlist.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
