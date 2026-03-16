'use client';

import { motion } from 'framer-motion';

interface GuardianCatSVGProps {
    isAwake: boolean;
}

export function GuardianCatSVG({ isAwake }: GuardianCatSVGProps) {
    // Colors matching the earth theme:
    // Base: #fb923c (earth-base approximation)
    // Dark: #c2410c
    // Accent: #f0e6dd

    return (
        <svg
            viewBox="0 0 200 200"
            className="w-48 h-48 drop-shadow-xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Body (Breathes) */}
            <motion.g
                animate={{
                    scaleY: isAwake ? [1, 1.02, 1] : [1, 1.05, 1],
                    y: isAwake ? [0, -2, 0] : [0, 2, 0]
                }}
                transition={{
                    repeat: Infinity,
                    duration: isAwake ? 2 : 4,
                    ease: "easeInOut"
                }}
                style={{ originX: "50%", originY: "100%" }}
            >
                {/* Main Body Curve */}
                <path d="M50 180 C50 100, 150 100, 150 180 Z" fill="#fb923c" />

                {/* Belly/Chest highlight */}
                <path d="M70 180 C70 130, 130 130, 130 180 Z" fill="#ffedd5" opacity="0.6" />

                {/* Tail */}
                <motion.path
                    d="M140 170 Q180 160, 170 130 Q160 100, 180 90"
                    stroke="#fb923c"
                    strokeWidth="16"
                    strokeLinecap="round"
                    fill="none"
                    animate={{
                        rotate: isAwake ? [0, 10, -5, 0] : [0, 5, 0]
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: isAwake ? 3 : 6,
                        ease: "easeInOut"
                    }}
                    style={{ originX: "140px", originY: "170px" }}
                />

                {/* Left Paw */}
                <motion.path
                    d="M70 175 Q80 185, 90 175"
                    stroke="#c2410c"
                    strokeWidth="12"
                    strokeLinecap="round"
                    animate={{
                        y: isAwake ? [0, -10, 0] : 0
                    }}
                    transition={{
                        duration: 0.5,
                        ease: "easeOut"
                    }}
                />

                {/* Right Paw */}
                <path d="M110 175 Q120 185, 130 175" stroke="#c2410c" strokeWidth="12" strokeLinecap="round" />
            </motion.g>

            {/* Head (Moves slightly independently) */}
            <motion.g
                animate={{
                    y: isAwake ? [0, -3, 0] : [0, 2, 0]
                }}
                transition={{
                    repeat: Infinity,
                    duration: isAwake ? 2.2 : 4.2,
                    ease: "easeInOut"
                }}
            >
                {/* Head Base */}
                <circle cx="100" cy="90" r="40" fill="#fb923c" />

                {/* Left Ear */}
                <path d="M65 70 L70 30 L95 55 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="2" strokeLinejoin="round" />
                <path d="M72 40 L76 60 L85 55 Z" fill="#ffedd5" />

                {/* Right Ear */}
                <path d="M135 70 L130 30 L105 55 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="2" strokeLinejoin="round" />
                <path d="M128 40 L124 60 L115 55 Z" fill="#ffedd5" />

                {/* Eyes */}
                <g fill="#431407">
                    {/* Left Eye */}
                    <motion.ellipse
                        cx="85" cy="85" rx="5" ry="5"
                        animate={{
                            scaleY: isAwake ? [1, 0.1, 1] : 0.1
                        }}
                        transition={{
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 4,
                            times: [0, 0.05, 0.1] // Quick blink
                        }}
                    />
                    {/* Right Eye */}
                    <motion.ellipse
                        cx="115" cy="85" rx="5" ry="5"
                        animate={{
                            scaleY: isAwake ? [1, 0.1, 1] : 0.1
                        }}
                        transition={{
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 4,
                            times: [0, 0.05, 0.1]
                        }}
                    />
                </g>

                {/* Nose / Snout */}
                <path d="M97 95 Q100 98, 103 95" stroke="#c2410c" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M100 98 L100 102" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" />

                {/* Whiskers */}
                <g stroke="#ffedd5" strokeWidth="2" strokeLinecap="round" opacity="0.6">
                    <motion.path d="M70 95 L50 90" animate={{ rotate: isAwake ? [0, 2, 0] : 0 }} style={{ originX: "70px", originY: "95px" }} transition={{ repeat: Infinity, duration: 2 }} />
                    <motion.path d="M70 100 L50 105" animate={{ rotate: isAwake ? [0, -2, 0] : 0 }} style={{ originX: "70px", originY: "100px" }} transition={{ repeat: Infinity, duration: 2.1 }} />
                    <motion.path d="M130 95 L150 90" animate={{ rotate: isAwake ? [0, -2, 0] : 0 }} style={{ originX: "130px", originY: "95px" }} transition={{ repeat: Infinity, duration: 2 }} />
                    <motion.path d="M130 100 L150 105" animate={{ rotate: isAwake ? [0, 2, 0] : 0 }} style={{ originX: "130px", originY: "100px" }} transition={{ repeat: Infinity, duration: 2.1 }} />
                </g>
            </motion.g>

            {/* A small floating spark indicating magic/notes */}
            <motion.circle
                cx="150" cy="50" r="4" fill="#ffedd5"
                animate={{
                    y: isAwake ? [-10, 10, -10] : 0,
                    opacity: isAwake ? [0, 1, 0] : 0,
                    scale: isAwake ? [0.5, 1.5, 0.5] : 0
                }}
                transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                }}
            />
        </svg>
    );
}
