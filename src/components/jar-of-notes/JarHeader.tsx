import { motion } from 'framer-motion';

interface JarHeaderProps {
    accentClass: string;
    accentColor: string;
}

export function JarHeader({ accentClass, accentColor }: JarHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pointer-events-none absolute left-0 right-0 top-16 z-20 px-4 text-center"
        >
            <h2 className="mb-3 text-3xl font-black uppercase tracking-normal text-white md:text-4xl font-mono">
                El Tarro de Notas
            </h2>
            <div className={`mx-auto mb-4 h-1 w-20 bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
            <p className="mx-auto max-w-xs text-sm leading-6 tracking-normal text-[#e1bfb2] font-sans">
                La nave de Kiaro, llena de pensamientos y amor.
            </p>
        </motion.div>
    );
}
