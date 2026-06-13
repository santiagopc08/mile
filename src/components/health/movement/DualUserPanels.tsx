import React from 'react';

export function DualUserPanels() {
    return (
        <>

                    {/* CAPA 2: DUAL USER PANELS (STATUS DISPLAY) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 border border-white/10 bg-[#030303] divide-y sm:divide-y-0 sm:divide-x divide-white/10 relative rounded-none">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                        {/* Panel de "ÉL" */}
                        <div className="p-5 pl-8 flex flex-col justify-between min-h-[120px] relative rounded-none">
                            {/* Left accent stripe */}
                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#c3f400]" />
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] font-bold text-[#c3f400] uppercase tracking-wider bg-[#c3f400]/5 px-2 py-0.5 border border-[#c3f400]/20 rounded-none font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#c3f400]" />
                                ÉL / TERAPIA Y RECUPERACIÓN
                            </div>
                            <div>
                                <h3 className="text-xs font-black tracking-wide text-white uppercase mt-4 mb-1 font-mono">
                                    Enfoque de Recuperación
                                </h3>
                                <p className="text-[10px] text-white/50 leading-relaxed mb-4 font-mono">
                                    Terapia física, terapia ocupacional, estiramiento táctico y movilidad articular.
                                </p>
                            </div>
                        </div>

                        {/* Panel de "ELLA" */}
                        <div className="p-5 pl-8 flex flex-col justify-between min-h-[120px] relative rounded-none">
                            {/* Left accent stripe */}
                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#ff4b89]" />
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] font-bold text-[#ff4b89] uppercase tracking-wider bg-[#ff4b89]/5 px-2 py-0.5 border border-[#ff4b89]/20 rounded-none font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#ff4b89]" />
                                ELLA / FUERZA Y RESISTENCIA
                            </div>
                            <div>
                                <h3 className="text-xs font-black tracking-wide text-white uppercase mt-4 mb-1 font-mono">
                                    Enfoque de Resistencia
                                </h3>
                                <p className="text-[10px] text-white/50 leading-relaxed mb-4 font-mono">
                                    Entrenamiento de potencia, fuerza muscular, cardio funcional y core.
                                </p>
                            </div>
                        </div>
                    </div>

        </>
    );
}
