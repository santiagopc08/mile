'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { StoreService } from '@/services/storeService';
import { Lock, Plus, Trash2, Edit, Music, Save } from 'lucide-react';

const ADMIN_PASSWORD = "administrado"; // Simple hardcoded password for MVP

export default function AdminPage() {
    const { data, isLoading, updateData } = useStore();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState<'events' | 'notes' | 'commitments' | 'audio' | 'listening'>('events');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    useEffect(() => {
        const auth = sessionStorage.getItem('adminAuth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminAuth', 'true');
            setIsAuthenticated(true);
        } else {
            setError('Contraseña incorrecta');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 z-50">
                <form onSubmit={handleLogin} className="w-full max-w-sm">
                    <div className="flex flex-col items-center mb-8">
                        <Lock className="w-12 h-12 text-earth-base mb-4" />
                        <h2 className="text-2xl font-light text-stone-800 dark:text-stone-200">Acceso Administrador</h2>
                    </div>

                    <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => { setPasswordInput(e.target.value); setError(''); }}
                        placeholder="Contraseña"
                        className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-6 py-4 text-center text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-earth-base/50 mb-4"
                    />

                    <button type="submit" className="w-full py-4 bg-earth-base text-white rounded-xl font-medium shadow-md hover:bg-earth-dark transition-colors text-lg">
                        Entrar
                    </button>
                    {error && <p className="text-red-500 text-center mt-4 text-sm">{error}</p>}
                </form>
            </div>
        );
    }

    if (isLoading || !data) return <div className="p-20 text-center">Cargando datos...</div>;

    const handleDeleteNote = async (index: number) => {
        const newNotes = data.notes.filter((_, i) => i !== index);
        await updateData({ notes: newNotes });
    };

    const handleAddNote = async (text: string) => {
        await updateData({ notes: [text, ...data.notes] });
    };

    const handleDeleteEvent = async (id: string) => {
        await updateData({ events: data.events.filter((e: any) => e.id !== id) });
    };

    const handleEditEventSave = async (e: React.FormEvent, id: string) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const title = (form.elements.namedItem('title') as HTMLInputElement).value;
        const date = (form.elements.namedItem('date') as HTMLInputElement).value;
        const desc = (form.elements.namedItem('desc') as HTMLTextAreaElement).value;

        if (title && date && desc) {
            const updatedEvents = data.events.map((ev: any) =>
                ev.id === id ? { ...ev, title, date, description: desc } : ev
            );
            await updateData({ events: updatedEvents });
            setEditingEventId(null);
        }
    };

    // Audio Playlist Management
    const handleAddTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const title = (form.elements.namedItem('title') as HTMLInputElement).value;
        const artist = (form.elements.namedItem('artist') as HTMLInputElement).value;
        const spotifyUrl = (form.elements.namedItem('spotifyUrl') as HTMLInputElement).value;

        if (title && spotifyUrl) {
            const newTrack = {
                id: Date.now().toString(),
                title,
                artist,
                spotifyUrl,
                display_order: data.audioPlaylist.length,
                added_by: 'el', // Defaulting to el in admin
                comments: []
            };
            await updateData({ audioPlaylist: [...data.audioPlaylist, newTrack] });
            form.reset();
        }
    };

    const handleDeleteTrack = async (id: string) => {
        await updateData({ audioPlaylist: data.audioPlaylist.filter(t => t.id !== id) });
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6 md:p-12">
            <div className="max-w-4xl mx-auto bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden mt-10">
                <header className="p-8 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-900/50">
                    <div>
                        <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-200">Panel de Administración</h1>
                        <p className="text-stone-500 text-sm mt-1">Gestiona el contenido de "Nuestro Refugio"</p>
                    </div>
                    <button
                        onClick={() => { sessionStorage.removeItem('adminAuth'); setIsAuthenticated(false); }}
                        className="text-sm font-medium text-stone-500 hover:text-earth-base"
                    >
                        Cerrar Sesión
                    </button>
                </header>

                <div className="flex border-b border-stone-100 dark:border-stone-800 overflow-x-auto custom-scrollbar">
                    {(['events', 'notes', 'commitments', 'audio', 'listening'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 px-4 whitespace-nowrap text-sm font-medium uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-earth-base border-b-2 border-earth-base bg-earth-50/10 dark:bg-earth-900/10' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                        >
                            {tab === 'events' ? 'Historia' : tab === 'notes' ? 'Tarro' : tab === 'commitments' ? 'Compromisos' : tab === 'audio' ? 'Audio' : 'Escucha'}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === 'notes' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-medium text-stone-800 dark:text-stone-200">Notas del Tarro</h2>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const input = e.currentTarget.elements.namedItem('newNote') as HTMLInputElement;
                                    if (input.value.trim()) {
                                        handleAddNote(input.value.trim());
                                        input.value = '';
                                    }
                                }}
                                className="flex gap-4"
                            >
                                <input name="newNote" type="text" placeholder="Escribe una nueva nota..." className="flex-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3" />
                                <button type="submit" className="bg-earth-base text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-transform active:scale-95"><Plus className="w-5 h-5" /> Añadir</button>
                            </form>

                            <ul className="space-y-3">
                                {data.notes.map((note, idx) => (
                                    <li key={idx} className="flex justify-between items-center p-4 bg-stone-50 dark:bg-stone-800 rounded-xl group">
                                        <p className="text-stone-700 dark:text-stone-300 font-light">{note}</p>
                                        <button onClick={() => handleDeleteNote(idx)} className="text-stone-300 group-hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'listening' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-medium text-stone-800 dark:text-stone-200">Escucha Persistente</h2>
                            <p className="text-sm text-stone-500 mb-4">Registra aquellas cosas tangibles que conversaron y que son importantes para ella (ej. "Me duele cuando no preguntas sobre mis amigas").</p>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const topic = (form.elements.namedItem('topic') as HTMLInputElement).value;
                                    const reflection = (form.elements.namedItem('reflection') as HTMLTextAreaElement).value;
                                    const date = (form.elements.namedItem('date') as HTMLInputElement).value;

                                    if (topic && reflection && date) {
                                        const newItem = { id: Date.now().toString(), topic, reflection, date };
                                        await updateData({ persistentListening: [newItem, ...(data.persistentListening || [])] });
                                        form.reset();
                                    }
                                }}
                                className="bg-stone-50 dark:bg-stone-950 p-6 rounded-2xl space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Tema Principal</label>
                                        <input name="topic" required placeholder="Ej: Visita de amigas..." className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 shadow-inner" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Fecha de la conversación</label>
                                        <input name="date" type="date" required className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 shadow-inner text-stone-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Tu Refelxión / Compromiso</label>
                                    <textarea name="reflection" required placeholder="Entiendo que te lastima cuando no muestro interés... me comprometo a..." className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 min-h-[100px] shadow-inner" />
                                </div>
                                <button type="submit" className="bg-earth-base text-white px-6 py-3 rounded-xl font-medium w-full flex items-center justify-center gap-2 shadow-md hover:bg-earth-dark transition-all active:scale-[0.98]">
                                    <Save className="w-5 h-5" /> Guardar Reflexión
                                </button>
                            </form>
                            <ul className="space-y-4 pt-4">
                                {(data.persistentListening || []).map((item: any) => (
                                    <li key={item.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-5 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl group shadow-sm">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <p className="font-semibold text-stone-800 dark:text-stone-200 text-lg">{item.topic}</p>
                                                <span className="text-[10px] bg-earth-50 text-earth-600 dark:bg-stone-800 dark:text-stone-400 px-2.5 py-1 rounded-full">{item.date}</span>
                                            </div>
                                            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-100 dark:border-stone-800/50 mt-2">{item.reflection}</p>
                                        </div>
                                        <div className="flex gap-3 mt-4 sm:mt-0 shrink-0 sm:ml-6 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                            <button onClick={async () => {
                                                await updateData({ persistentListening: data.persistentListening.filter((x: any) => x.id !== item.id) });
                                            }} className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </li>
                                ))}
                                {(!data.persistentListening || data.persistentListening.length === 0) && (
                                    <p className="text-center text-stone-400 py-10 font-light italic">No hay reflexiones agregadas aún.</p>
                                )}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-medium text-stone-800 dark:text-stone-200">Línea de Tiempo</h2>

                            {/* New Event Form */}
                            <form className="bg-stone-50 dark:bg-stone-950 p-6 rounded-2xl space-y-4" onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                                const date = (form.elements.namedItem('date') as HTMLInputElement).value;
                                const desc = (form.elements.namedItem('desc') as HTMLTextAreaElement).value;
                                const imageInput = form.elements.namedItem('image') as HTMLInputElement;
                                const file = imageInput?.files?.[0];

                                if (title && date && desc) {
                                    let imageUrl = null;
                                    if (file) {
                                        try {
                                            imageUrl = await StoreService.uploadTimelineImage(file);
                                        } catch (err) {
                                            console.error("Upload failed", err);
                                            alert("Error al subir la imagen. Revisa la configuración en Supabase.");
                                            return;
                                        }
                                    }
                                    const newEvent = { id: Date.now().toString(), title, date, description: desc, imageUrl };
                                    await updateData({ events: [newEvent, ...data.events] });
                                    form.reset();
                                }
                            }}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Título</label>
                                        <input name="title" required placeholder="Título del hito" className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 shadow-inner" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Fecha</label>
                                        <input name="date" type="date" required className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 shadow-inner text-stone-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Descripción</label>
                                    <textarea name="desc" required placeholder="Descripción de lo que sucedió..." className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 min-h-[100px] shadow-inner" />
                                </div>
                                <div className="space-y-1 mt-4">
                                    <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Imagen (Opcional)</label>
                                    <input name="image" type="file" accept="image/*" className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 shadow-inner file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-earth-base file:text-white hover:file:bg-earth-dark cursor-pointer" />
                                </div>
                                <button type="submit" className="bg-earth-base text-white px-6 py-3 rounded-xl font-medium w-full flex items-center justify-center gap-2 shadow-md hover:bg-earth-dark transition-all active:scale-[0.98]">
                                    <Save className="w-5 h-5" /> Guardar Evento
                                </button>
                            </form>

                            <ul className="space-y-4">
                                {data.events.map((ev: any) => (
                                    <li key={ev.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-stone-200 dark:border-stone-800 rounded-xl group">
                                        {editingEventId === ev.id ? (
                                            <form className="w-full space-y-3" onSubmit={(e) => handleEditEventSave(e, ev.id)}>
                                                <div className="flex gap-4">
                                                    <input name="title" defaultValue={ev.title} required className="flex-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2" />
                                                    <input name="date" type="date" defaultValue={ev.date} required className="flex-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2" />
                                                </div>
                                                <textarea name="desc" defaultValue={ev.description} required className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 min-h-[80px]" />
                                                <div className="flex gap-2">
                                                    <button type="submit" className="bg-earth-base text-white px-4 py-2 rounded-xl text-sm">Guardar</button>
                                                    <button type="button" onClick={() => setEditingEventId(null)} className="bg-stone-200 dark:bg-stone-800 px-4 py-2 rounded-xl text-sm">Cancelar</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold text-stone-800 dark:text-stone-200">{ev.title}</p>
                                                        <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full text-stone-500">{ev.date}</span>
                                                    </div>
                                                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{ev.description}</p>
                                                </div>
                                                <div className="flex gap-3 mt-4 sm:mt-0 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingEventId(ev.id)} className="text-stone-400 hover:text-earth-base"><Edit className="w-5 h-5" /></button>
                                                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-stone-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'commitments' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-medium text-stone-800 dark:text-stone-200">Compromisos Diarios</h2>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const input = e.currentTarget.elements.namedItem('newComm') as HTMLInputElement;
                                    if (input.value.trim()) {
                                        const newC = { id: Date.now().toString(), text: input.value.trim(), completed: false };
                                        await updateData({ commitments: [...data.commitments, newC] });
                                        input.value = '';
                                    }
                                }}
                                className="flex gap-4 mb-6"
                            >
                                <input name="newComm" type="text" placeholder="Nuevo compromiso..." className="flex-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3" />
                                <button type="submit" className="bg-earth-base text-white px-6 py-3 rounded-xl flex items-center gap-2"><Plus className="w-5 h-5" /> Añadir</button>
                            </form>
                            <ul className="space-y-3">
                                {data.commitments.map((c: any) => (
                                    <li key={c.id} className="flex justify-between items-center p-4 bg-stone-50 dark:bg-stone-800 rounded-xl group">
                                        <p className="text-stone-700 dark:text-stone-300 font-light">{c.text}</p>
                                        <button onClick={async () => {
                                            await updateData({ commitments: data.commitments.filter((x: any) => x.id !== c.id) });
                                        }} className="text-stone-300 group-hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'audio' && (
                        <div className="space-y-8">
                            <h2 className="text-xl font-medium text-stone-800 dark:text-stone-200">Gestión de Playlist</h2>

                            <form className="bg-stone-50 dark:bg-stone-950 p-6 rounded-2xl space-y-4 border border-stone-100 dark:border-transparent shadow-sm" onSubmit={handleAddTrack}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Título</label>
                                        <input name="title" required placeholder="Nombre de la canción" className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 shadow-inner" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Artista</label>
                                        <input name="artist" placeholder="Nombre del artista" className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 shadow-inner" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-stone-400 uppercase tracking-wider ml-1">Enlace de Spotify</label>
                                    <input name="spotifyUrl" required placeholder="https://open.spotify.com/track/..." className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 shadow-inner" />
                                </div>
                                <button type="submit" className="bg-earth-base text-white px-6 py-3 rounded-xl font-medium w-full flex items-center justify-center gap-2 shadow-md hover:bg-earth-dark transition-all active:scale-[0.98]">
                                    <Plus className="w-5 h-5" /> Añadir a la Playlist
                                </button>
                            </form>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest pl-2">Canciones Actuales</h3>
                                <ul className="space-y-3">
                                    {data.audioPlaylist.map((track: any) => (
                                        <li key={track.id} className="flex items-center justify-between p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl group shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-stone-50 dark:bg-stone-800 rounded-lg flex items-center justify-center text-earth-base">
                                                    <Music className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-stone-800 dark:text-stone-200">{track.title}</p>
                                                    <p className="text-xs text-stone-400">{track.artist || 'Artista Desconocido'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <span className="text-[10px] text-stone-300 font-mono tracking-tighter hidden sm:block truncate max-w-[150px]">{track.spotifyUrl}</span>
                                                <button onClick={() => handleDeleteTrack(track.id)} className="text-stone-300 group-hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </li>
                                    ))}
                                    {data.audioPlaylist.length === 0 && (
                                        <p className="text-center text-stone-400 py-10 font-light italic">No hay canciones agregadas aún.</p>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
