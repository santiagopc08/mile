import { ArrowRight, ChevronLeft } from 'lucide-react';

interface LoginFormProps {
    keyword: string;
    onKeywordChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    error: boolean;
    accentColor: string;
    highlightColor: string;
}

export function LoginForm({ keyword, onKeywordChange, onSubmit, onCancel, error, accentColor, highlightColor }: LoginFormProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <form onSubmit={onSubmit} className="relative flex flex-col">
                <div className="relative">
                    <input
                        autoFocus
                        type="password"
                        value={keyword}
                        onChange={(e) => onKeywordChange(e.target.value)}
                        placeholder="CONTRASEÑA"
                        className="w-full border bg-black py-4 pl-4 pr-14 text-center text-sm font-bold tracking-[0.25em] text-white outline-none transition-all placeholder:text-white/20 placeholder:tracking-normal focus:bg-black/50"
                        style={{
                            borderColor: error ? '#ff4b89' : accentColor,
                            color: highlightColor,
                            boxShadow: `0 0 10px ${accentColor}15`
                        }}
                    />
                    <button
                        type="submit"
                        className="absolute right-0 top-0 bottom-0 flex aspect-square items-center justify-center transition-all hover:opacity-85 active:scale-95"
                        style={{
                            backgroundColor: accentColor,
                            color: '#131313'
                        }}
                    >
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                </div>
            </form>

            <button
                onClick={onCancel}
                className="flex w-full items-center justify-center py-2 text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
            >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Elegir otro perfil
            </button>
        </div>
    );
}
