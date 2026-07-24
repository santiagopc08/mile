'use client';

/**
 * Toast — sistema de avisos no bloqueantes en estética cyber-brutalista.
 *
 * Sustituye a `alert()` / `window.confirm()` nativos: aquellos congelan el hilo
 * principal, cortan las animaciones en curso y en la PWA de iOS aparecen con el
 * prefijo del dominio ("localhost dice…"), rompiendo por completo la ilusión de
 * app nativa. Aquí los avisos se apilan, se auto-descartan, se pueden arrastrar
 * para cerrar y anuncian por `aria-live` a lectores de pantalla.
 *
 * Uso:
 *   const { success, error, info, confirm } = useToast();
 *   success('Foto subida');
 *   if (await confirm({ title: '¿Canjear cupón?', tone: 'danger' })) { ... }
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XOctagon } from 'lucide-react';
import { haptics } from '@/lib/haptics';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    /** Cuerpo del aviso. */
    message: string;
    /** Rótulo corto en mayúsculas sobre el mensaje. */
    title?: string;
    variant?: ToastVariant;
    /** Milisegundos antes del auto-descarte. 0 = persistente hasta cerrar. */
    duration?: number;
    /** Clave estable: un aviso con la misma clave reemplaza al anterior en vez de apilarse. */
    key?: string;
}

interface ToastRecord extends Required<Omit<ToastOptions, 'title' | 'key'>> {
    id: string;
    title?: string;
    key?: string;
}

interface ConfirmOptions {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'neutral';
}

interface ConfirmRequest extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

interface ToastContextValue {
    toast: (options: ToastOptions) => string;
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
    dismiss: (id: string) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLE: Record<ToastVariant, { accent: string; icon: typeof Info; label: string }> = {
    success: { accent: '#c3f400', icon: CheckCircle2, label: 'Listo' },
    error: { accent: '#ef4444', icon: XOctagon, label: 'Error' },
    warning: { accent: '#ffb703', icon: AlertTriangle, label: 'Atención' },
    info: { accent: '#a178ff', icon: Info, label: 'Sistema' },
};

/** Chaflán a 45° en la esquina superior derecha e inferior izquierda (ver design.md). */
const CHAMFER = 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))';

const MAX_VISIBLE = 3;

/**
 * `false` en el render del servidor y en la hidratación, `true` después: el
 * portal necesita `document.body`, que no existe en SSR. Vía
 * `useSyncExternalStore` en vez de `useState` + efecto para no encadenar un
 * render extra en cada montaje.
 */
const neverChanges = () => () => {};
function useIsMounted() {
    return useSyncExternalStore(
        neverChanges,
        () => true,
        () => false
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);
    const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
    const mounted = useIsMounted();
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

    useEffect(() => {
        const pending = timers.current;
        return () => {
            pending.forEach((timer) => clearTimeout(timer));
            pending.clear();
        };
    }, []);

    const dismiss = useCallback((id: string) => {
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback(
        ({ message, title, variant = 'info', duration = 4200, key }: ToastOptions) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const record: ToastRecord = { id, message, title, variant, duration, key };

            setToasts((prev) => {
                // Una clave repetida sustituye al aviso previo (evita spam de "sin conexión").
                const deduped = key ? prev.filter((t) => t.key !== key) : prev;
                return [...deduped, record].slice(-MAX_VISIBLE);
            });

            if (variant === 'success') haptics.triggerSuccess();
            else if (variant === 'error') haptics.triggerError();
            else haptics.triggerTick();

            if (duration > 0) {
                timers.current.set(
                    id,
                    setTimeout(() => dismiss(id), duration)
                );
            }
            return id;
        },
        [dismiss]
    );

    const confirm = useCallback((options: ConfirmOptions) => {
        haptics.triggerTick();
        return new Promise<boolean>((resolve) => {
            setConfirmRequest({ ...options, resolve });
        });
    }, []);

    const resolveConfirm = useCallback(
        (value: boolean) => {
            setConfirmRequest((current) => {
                current?.resolve(value);
                return null;
            });
        },
        []
    );

    const value = useMemo<ToastContextValue>(
        () => ({
            toast,
            dismiss,
            confirm,
            success: (message, title) => toast({ message, title, variant: 'success' }),
            error: (message, title) => toast({ message, title, variant: 'error', duration: 6000 }),
            warning: (message, title) => toast({ message, title, variant: 'warning', duration: 5200 }),
            info: (message, title) => toast({ message, title, variant: 'info' }),
        }),
        [toast, dismiss, confirm]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            {mounted &&
                createPortal(
                    <>
                        <ToastViewport toasts={toasts} onDismiss={dismiss} />
                        <AnimatePresence>
                            {confirmRequest && (
                                <ConfirmDialog request={confirmRequest} onResolve={resolveConfirm} />
                            )}
                        </AnimatePresence>
                    </>,
                    document.body
                )}
        </ToastContext.Provider>
    );
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: string) => void }) {
    return (
        <div
            className="toast-viewport pointer-events-none fixed inset-x-0 top-0 z-[120] flex flex-col items-center gap-2 px-3 lg:left-auto lg:right-6 lg:items-end lg:px-0"
            aria-live="polite"
            aria-relevant="additions text"
        >
            <AnimatePresence initial={false}>
                {toasts.map((t) => (
                    <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastCard({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
    const { accent, icon: Icon, label } = VARIANT_STYLE[toast.variant];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0 }}
            onDragEnd={(_, info) => {
                if (info.offset.y < -32) onDismiss(toast.id);
            }}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto relative w-full max-w-md overflow-hidden border bg-[#0a070c]/97 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
            style={{
                clipPath: CHAMFER,
                borderColor: `${accent}66`,
                boxShadow: `0 0 24px ${accent}22, 0 16px 40px rgba(0,0,0,0.65)`,
            }}
        >
            {/* Barra de acento lateral */}
            <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: accent }} aria-hidden="true" />

            <div className="flex items-start gap-3 py-3 pl-4 pr-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p
                        className="font-mono text-[8.5px] font-black uppercase tracking-[0.22em]"
                        style={{ color: accent }}
                    >
                        {toast.title ?? label}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-snug text-[#e5e2e1] break-words">{toast.message}</p>
                </div>
                <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    className="-mr-0.5 shrink-0 p-2 text-[#a88a7e] transition-colors hover:text-white active:scale-90"
                    aria-label="Cerrar aviso"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Cuenta atrás visual del auto-descarte */}
            {toast.duration > 0 && (
                <motion.span
                    className="absolute bottom-0 left-0 h-[2px] origin-left"
                    style={{ backgroundColor: accent, width: '100%' }}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                    aria-hidden="true"
                />
            )}
        </motion.div>
    );
}

function ConfirmDialog({ request, onResolve }: { request: ConfirmRequest; onResolve: (value: boolean) => void }) {
    const accent = request.tone === 'danger' ? '#ef4444' : '#a178ff';
    const panelRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // En acciones destructivas el foco arranca en «Cancelar»: así un Enter
        // reflejo cancela en vez de borrar. En las neutras, en «Confirmar».
        if (request.tone === 'danger') cancelRef.current?.focus();
        else confirmRef.current?.focus();
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onResolve(false);
                return;
            }
            // Trampa de foco: el diálogo es modal, el tabulador no debe escapar detrás.
            if (e.key === 'Tab' && panelRef.current) {
                const focusables = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onResolve, request.tone]);

    return (
        <motion.div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onResolve(false)}
        >
            <motion.div
                ref={panelRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby={request.message ? 'confirm-message' : undefined}
                initial={{ scale: 0.94, y: 14 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm border bg-[#0a070c]/98 p-5 backdrop-blur-xl"
                style={{
                    clipPath: CHAMFER,
                    borderColor: `${accent}77`,
                    boxShadow: `0 0 36px ${accent}25, 0 20px 60px rgba(0,0,0,0.75)`,
                }}
            >
                <div className="flex items-center gap-2">
                    <span className="animate-spin-slow text-[10px]" style={{ color: accent }} aria-hidden="true">
                        ◆
                    </span>
                    <h2
                        id="confirm-title"
                        className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-white"
                    >
                        {request.title}
                    </h2>
                </div>
                <span
                    className="mt-2 block h-px w-full"
                    style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                    aria-hidden="true"
                />

                {request.message && (
                    <p id="confirm-message" className="mt-3 text-[13px] leading-relaxed text-[#c9c2c0]">
                        {request.message}
                    </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={() => onResolve(false)}
                        className="border border-white/15 bg-white/[0.06] px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#e5e2e1] transition-colors hover:bg-white/[0.12] active:scale-95"
                    >
                        {request.cancelLabel ?? 'Cancelar'}
                    </button>
                    <button
                        ref={confirmRef}
                        type="button"
                        onClick={() => {
                            haptics.triggerSave();
                            onResolve(true);
                        }}
                        className="border px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white transition-all active:scale-95"
                        style={{ borderColor: accent, backgroundColor: `${accent}30`, boxShadow: `0 0 16px ${accent}25` }}
                    >
                        {request.confirmLabel ?? 'Confirmar'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe usarse dentro de un ToastProvider');
    }
    return context;
}
