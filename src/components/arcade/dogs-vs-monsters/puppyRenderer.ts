'use client';

export type PuppyBreed = 'dachshund' | 'poodle' | 'corgi' | 'pug' | 'pomeranian';

export interface PuppyTheme {
    bodyColor: string;
    bumperColor: string;
    roofColor: string;
    breed: PuppyBreed;
    name: string;
    breedName: string;
}

export const PUPPY_CAR_THEMES: PuppyTheme[] = [
    {
        bodyColor: '#ef4444',
        bumperColor: '#b91c1c',
        roofColor: '#facc15',
        breed: 'dachshund',
        name: 'Otto',
        breedName: 'Perrito Salchicha 🌭',
    },
    {
        bodyColor: '#ec4899',
        bumperColor: '#be185d',
        roofColor: '#fdf2f8',
        breed: 'poodle',
        name: 'Coco',
        breedName: 'French Poodle 🐩',
    },
    {
        bodyColor: '#0284c7',
        bumperColor: '#0369a1',
        roofColor: '#38bdf8',
        breed: 'corgi',
        name: 'Mochi',
        breedName: 'Corgi Galés 🦊',
    },
    {
        bodyColor: '#8b5cf6',
        bumperColor: '#6d28d9',
        roofColor: '#facc15',
        breed: 'pug',
        name: 'Toby',
        breedName: 'Pug Travieso 🐾',
    },
    {
        bodyColor: '#84cc16',
        bumperColor: '#4d7c0f',
        roofColor: '#fb923c',
        breed: 'pomeranian',
        name: 'Teddy',
        breedName: 'Pomerania Golden 🦁',
    },
];

/**
 * Draws a high-definition, animated 2D vector puppy driver inside the ride-on car.
 */
export function drawPuppyDriver2D(
    ctx: CanvasRenderingContext2D,
    breed: PuppyBreed,
    time: number,
    isRushing: boolean,
    laneIdx: number
) {
    ctx.save();
    ctx.translate(0, -14); // Position inside cabin

    const earWind = isRushing ? -0.45 : Math.sin(time * 0.008 + laneIdx) * 0.12;
    const tongueWag = Math.sin(time * 0.015) * 0.15;

    switch (breed) {
        // ─────────────────────────────────────────────────────────────────────
        // 1. PERRITO SALCHICHA (Dachshund)
        // ─────────────────────────────────────────────────────────────────────
        case 'dachshund': {
            // Long Floppy Ears (drawn behind head)
            // Left Ear
            ctx.save();
            ctx.translate(-9, -4);
            ctx.rotate(-0.2 + earWind);
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(0, 8, 4.5, 9.5, -0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Right Ear
            ctx.save();
            ctx.translate(8, -4);
            ctx.rotate(0.2 - earWind);
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(0, 8, 4.5, 9.5, 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Head (Caramel brown gradient)
            const headGrad = ctx.createLinearGradient(-10, -12, 10, 10);
            headGrad.addColorStop(0, '#b45309');
            headGrad.addColorStop(1, '#92400e');
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.ellipse(0, -2, 10, 11, 0, 0, Math.PI * 2);
            ctx.fill();

            // Long Snout (Dachshund muzzle)
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.ellipse(0, 3, 6, 6.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shiny Black Nose
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(0, 1.5, 2.8, 2.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-0.8, 1, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Cute Puppy Eyes
            [-4.5, 4.5].forEach(ex => {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(ex, -4, 2.6, 0, Math.PI * 2);
                ctx.fill();
                // Specular glint
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ex - 0.7, -4.7, 0.9, 0, Math.PI * 2);
                ctx.arc(ex + 0.7, -3.4, 0.5, 0, Math.PI * 2);
                ctx.fill();
            });

            // Mouth & Tiny Tongue
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(-1.5, 5.5, 1.8, 0.2, Math.PI * 0.9);
            ctx.arc(1.5, 5.5, 1.8, 0.1, Math.PI * 0.8);
            ctx.stroke();

            // Tongue sticking out
            ctx.save();
            ctx.translate(0, 6.5);
            ctx.rotate(tongueWag);
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.ellipse(0, 1.8, 1.8, 2.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. FRENCH POODLE (Caniche Toy)
        // ─────────────────────────────────────────────────────────────────────
        case 'poodle': {
            // Puffy Cloud Ears (Left & Right)
            const drawPuffEar = (x: number, angle: number) => {
                ctx.save();
                ctx.translate(x, -2);
                ctx.rotate(angle);
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.arc(0, 4, 4.5, 0, Math.PI * 2);
                ctx.arc(0, 8, 5, 0, Math.PI * 2);
                ctx.fill();
                // Soft pastel shading
                ctx.fillStyle = '#fce7f3';
                ctx.beginPath();
                ctx.arc(0, 6, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            drawPuffEar(-10, -0.2 + earWind);
            drawPuffEar(10, 0.2 - earWind);

            // Head (Fluffy Cream Base)
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(0, -1, 9.5, 9.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Poodle Crown Fluff Pom-Poms on top of head
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-4, -9, 4.5, 0, Math.PI * 2);
            ctx.arc(0, -11, 5, 0, Math.PI * 2);
            ctx.arc(4, -9, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Cute Pink Bow on top
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.ellipse(-3, -11, 2.5, 1.6, -0.4, 0, Math.PI * 2);
            ctx.ellipse(3, -11, 2.5, 1.6, 0.4, 0, Math.PI * 2);
            ctx.arc(0, -11, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Blushing Cheeks
            ctx.fillStyle = 'rgba(244, 114, 182, 0.5)';
            ctx.beginPath();
            ctx.arc(-5.5, 1, 2.5, 0, Math.PI * 2);
            ctx.arc(5.5, 1, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Snout & Button Nose
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.ellipse(0, 2.5, 4.2, 3.8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(0, 1.5, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Big Sparkling Anime Eyes
            [-4, 4].forEach(ex => {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(ex, -3, 2.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ex - 0.7, -3.7, 0.9, 0, Math.PI * 2);
                ctx.arc(ex + 0.6, -2.4, 0.4, 0, Math.PI * 2);
                ctx.fill();
            });

            // Sweet smile
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(0, 4, 1.8, 0.2, Math.PI - 0.2);
            ctx.stroke();
            break;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 3. CORGI GALÉS (Pembroke Welsh Corgi)
        // ─────────────────────────────────────────────────────────────────────
        case 'corgi': {
            // Big Pointed Triangular Ears
            const drawCorgiEar = (x: number, angle: number, flip: number) => {
                ctx.save();
                ctx.translate(x, -6);
                ctx.rotate(angle);
                // Outer Golden Ear
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.moveTo(0, 4);
                ctx.lineTo(-4 * flip, -10);
                ctx.lineTo(4 * flip, -12);
                ctx.closePath();
                ctx.fill();

                // Inner Pink Ear
                ctx.fillStyle = '#fbcfe8';
                ctx.beginPath();
                ctx.moveTo(0, 2);
                ctx.lineTo(-2.5 * flip, -8);
                ctx.lineTo(2.5 * flip, -9.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            };
            drawCorgiEar(-7, -0.3 + earWind, 1);
            drawCorgiEar(7, 0.3 - earWind, -1);

            // Head (Golden Orange)
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.ellipse(0, -1, 10, 9.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Classic Corgi White Blaze (Center Stripe & Muzzle)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(-2.5, -2);
            ctx.lineTo(-6, 4);
            ctx.quadraticCurveTo(0, 7.5, 6, 4);
            ctx.lineTo(2.5, -2);
            ctx.closePath();
            ctx.fill();

            // Black Button Nose
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(0, 1.8, 2.4, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-0.6, 1.3, 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Cheerful Dark Eyes
            [-4.8, 4.8].forEach(ex => {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(ex, -3, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ex - 0.7, -3.7, 0.8, 0, Math.PI * 2);
                ctx.fill();
            });

            // Fox Smile & Tongue
            ctx.strokeStyle = '#431407';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(-1.5, 4, 1.6, 0.2, Math.PI * 0.9);
            ctx.arc(1.5, 4, 1.6, 0.1, Math.PI * 0.8);
            ctx.stroke();

            // Happy Corgi Tongue
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.ellipse(0, 6, 2, 2.8, tongueWag, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 4. PUG / BULLDOG FRANCÉS
        // ─────────────────────────────────────────────────────────────────────
        case 'pug': {
            // Folded Dark Button Ears
            const drawPugEar = (x: number, angle: number) => {
                ctx.save();
                ctx.translate(x, -6);
                ctx.rotate(angle + earWind);
                ctx.fillStyle = '#292524';
                ctx.beginPath();
                ctx.ellipse(0, 3, 4, 5, 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            drawPugEar(-8, -0.3);
            drawPugEar(8, 0.3);

            // Round Squishy Head (Fawn color)
            ctx.fillStyle = '#e7e5e4';
            ctx.beginPath();
            ctx.ellipse(0, -1, 10.5, 9.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Forehead Wrinkles
            ctx.strokeStyle = '#a8a29e';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, -6, 4, 0.4, Math.PI - 0.4);
            ctx.arc(0, -4, 3, 0.3, Math.PI - 0.3);
            ctx.stroke();

            // Dark Charcoal Muzzle Mask
            ctx.fillStyle = '#292524';
            ctx.beginPath();
            ctx.ellipse(0, 2, 6.5, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Squishy Nose
            ctx.fillStyle = '#0c0a09';
            ctx.beginPath();
            ctx.ellipse(0, 0.8, 3, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Big Round Googly Eyes
            [-4.5, 4.5].forEach(ex => {
                ctx.fillStyle = '#0c0a09';
                ctx.beginPath();
                ctx.arc(ex, -3, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ex - 0.9, -3.9, 1.1, 0, Math.PI * 2);
                ctx.arc(ex + 0.8, -2.2, 0.5, 0, Math.PI * 2);
                ctx.fill();
            });

            // Derpy Sideways Tongue
            ctx.save();
            ctx.translate(2.5, 4.5);
            ctx.rotate(0.3 + tongueWag);
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.ellipse(0, 1.8, 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 5. POMERANIA / GOLDEN PUPPY
        // ─────────────────────────────────────────────────────────────────────
        case 'pomeranian': {
            // Big Fluffy Lion-Mane Fur Halo
            ctx.fillStyle = '#f59e0b';
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
                const fx = Math.cos(a) * 9.5;
                const fy = Math.sin(a) * 9.5;
                ctx.beginPath();
                ctx.arc(fx, fy - 1, 4.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Rounded Teddy Bear Ears
            [-7, 7].forEach(ex => {
                ctx.fillStyle = '#d97706';
                ctx.beginPath();
                ctx.arc(ex, -8 + earWind * 3, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fde68a';
                ctx.beginPath();
                ctx.arc(ex, -8 + earWind * 3, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Face (Warm Golden Fluff)
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(0, -1, 8.5, 8.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Muzzle
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.ellipse(0, 2.5, 4.5, 3.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shiny Button Nose
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(0, 1.2, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-0.5, 0.8, 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Sparkly Puppy Eyes
            [-3.8, 3.8].forEach(ex => {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(ex, -3, 2.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ex - 0.6, -3.6, 0.8, 0, Math.PI * 2);
                ctx.fill();
            });

            // Rosy cheeks
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.beginPath();
            ctx.arc(-5, 1.5, 2.2, 0, Math.PI * 2);
            ctx.arc(5, 1.5, 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Happy open smile
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(0, 3.5, 1.6, 0.2, Math.PI - 0.2);
            ctx.stroke();

            // Little pink tongue
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.arc(0, 4.8, 1.2, 0, Math.PI);
            ctx.fill();
            break;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COCKPIT STEERING WHEEL & CUTE PUPPY PAWS ON TOP OF WHEEL
    // ─────────────────────────────────────────────────────────────────────────
    ctx.restore(); // Return to car coordinate space

    ctx.save();
    ctx.translate(0, -6);

    // Black Sports Steering Wheel
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(3, 4, 10, 4.5, 2);
    ctx.fill();

    // Yellow Horn Button
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(8, 6.2, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Two Little Fluffy Paws resting on the steering wheel / door
    const pawColor =
        breed === 'poodle'
            ? '#ffffff'
            : breed === 'corgi'
            ? '#ffffff'
            : breed === 'dachshund'
            ? '#92400e'
            : breed === 'pug'
            ? '#d6d3d1'
            : '#f59e0b';

    // Left Paw
    ctx.fillStyle = pawColor;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(3, 3, 2.8, 2.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Paw
    ctx.beginPath();
    ctx.ellipse(12, 3, 2.8, 2.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}
