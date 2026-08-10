import { motion, AnimatePresence } from 'framer-motion';
import { RefObject } from 'react';
import { AnimState } from './types';

interface JarMediaProps {
    animState: AnimState;
    showImg1: boolean;
    showImg2: boolean;
    isVideoVisible: boolean;
    videoRef: RefObject<HTMLVideoElement | null>;
    handleVideoEnded: () => void;
}

export function JarMedia({
    animState,
    showImg1,
    showImg2,
    isVideoVisible,
    videoRef,
    handleVideoEnded
}: JarMediaProps) {
    return (
        <>
            {/* IMG 1 */}
            <AnimatePresence>
                {showImg1 && (
                    <motion.img
                        src="/jar/jar1.png"
                        alt="Jar 1"
                        className="absolute w-full h-full md:w-full md:h-full object-contain z-10"
                        initial={{ scale: animState === 'reverse-img1' ? 1.5 : 1, opacity: 1 }}
                        animate={{ scale: animState === 'img1' ? 1.5 : 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: animState === 'reverse-img1' ? 0.25 : 0.5 }}
                    />
                )}
            </AnimatePresence>

            {/* IMG 2 */}
            <AnimatePresence>
                {showImg2 && (
                    <motion.img
                        src="/jar/jar2.png"
                        alt="Jar 2"
                        className="absolute w-full h-full md:w-full md:h-full object-contain z-20"
                        initial={{ scale: animState === 'img2' ? 1.5 : 2, opacity: 0 }}
                        animate={{ scale: animState === 'img2' ? 2 : 1.5, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: animState === 'reverse-img2' ? 0.25 : 0.5 }}
                    />
                )}
            </AnimatePresence>

            {/* VIDEO */}
            <video
                ref={videoRef}
                src="/jar/jarVid.mp4"
                className={`absolute inset-0 w-full h-full object-cover z-30 transition-opacity duration-300 ${isVideoVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                playsInline
                webkit-playsinline="true"
                muted
                onEnded={handleVideoEnded}
            />
        </>
    );
}
