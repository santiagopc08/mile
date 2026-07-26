'use client';

/**
 * global-error.tsx — última red de seguridad.
 *
 * Se activa cuando la excepción ocurre en el propio layout raíz, donde
 * `error.tsx` ya no puede montarse. Reemplaza al documento entero, así que
 * debe renderizar sus propios <html> y <body> y no puede apoyarse en las
 * fuentes ni en las variables CSS del layout: por eso va todo en estilos
 * en línea, sin depender de Tailwind ni de globals.css.
 */

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es">
            <body
                style={{
                    margin: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                    background: '#1f0e13',
                    color: '#fbdae0',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
            >
                <div
                    style={{
                        maxWidth: '26rem',
                        width: '100%',
                        border: '1px solid rgba(239,68,68,0.5)',
                        background: '#0a070c',
                        padding: '1.5rem',
                        clipPath:
                            'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
                        boxShadow: '0 0 40px rgba(239,68,68,0.18)',
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: '11px',
                            fontWeight: 900,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: '#fff',
                        }}
                    >
                        La aplicación se detuvo
                    </h1>
                    <div
                        style={{
                            height: '1px',
                            margin: '0.6rem 0 1rem',
                            background: 'linear-gradient(90deg, #ef4444, transparent)',
                        }}
                    />
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#c9c2c0' }}>
                        Ha fallado algo básico al arrancar. Tus datos están a salvo: no se ha borrado
                        nada.
                    </p>

                    {error.digest && (
                        <p
                            style={{
                                marginTop: '0.75rem',
                                fontSize: '9px',
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: '#a88a7e',
                            }}
                        >
                            Referencia · {error.digest}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={reset}
                        style={{
                            marginTop: '1.5rem',
                            width: '100%',
                            cursor: 'pointer',
                            border: '1px solid #a178ff',
                            background: 'rgba(161,120,255,0.25)',
                            color: '#fff',
                            padding: '0.7rem 1rem',
                            fontFamily: 'inherit',
                            fontSize: '10px',
                            fontWeight: 900,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            boxShadow: '0 0 16px rgba(161,120,255,0.25)',
                        }}
                    >
                        Reiniciar la aplicación
                    </button>
                </div>
            </body>
        </html>
    );
}
