import { Shield } from 'lucide-react';
import { ReactNode } from 'react';

interface LoginCardProps {
    selectedProfile: 'el' | 'ella' | null;
    accentColor: string;
    highlightColor: string;
    children: ReactNode;
}

export function LoginCard({ selectedProfile, accentColor, highlightColor, children }: LoginCardProps) {
    return (
        <div className="relative z-20 w-full max-w-sm font-mono">
            {/* Main Card Wrapper */}
            <div className="border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-8 relative overflow-hidden transition-all duration-700 shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
                style={{
                    borderColor: selectedProfile ? `${accentColor}50` : 'rgba(255, 255, 255, 0.15)',
                    boxShadow: selectedProfile ? `0 0 40px ${accentColor}25, 0 25px 60px rgba(0,0,0,0.7)` : '0 25px 60px rgba(0,0,0,0.7)'
                }}>
                {/* Corner Accent Box */}
                <div className="absolute top-0 right-0 p-1 font-mono text-[6px] text-white/40 border-b border-l border-white/10 uppercase bg-white/[0.08] backdrop-blur-md">
                    ACCESO 01
                </div>

                <div className="text-center mb-8">
                    {/* Interactive Dynamic Shield Logo */}
                    <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 bg-white/[0.05] backdrop-blur-md transition-all duration-700"
                        style={{
                            borderColor: accentColor,
                            color: highlightColor,
                            boxShadow: selectedProfile ? `0 0 20px ${accentColor}40` : 'none',
                            transform: selectedProfile ? 'rotate(90deg)' : 'none'
                        }}
                    >
                        <Shield className="w-6 h-6 transition-transform duration-700" />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-white mb-1">
                        CONTROL DE ACCESO
                    </h2>
                    <p className="text-[9px] text-[#a88a7e] uppercase tracking-[0.16em]">
                        SELECCIONE PERFIL OPERATIVO
                    </p>
                </div>

                {/* Interactive Body */}
                <div className="relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
