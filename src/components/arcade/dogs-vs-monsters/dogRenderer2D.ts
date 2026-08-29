'use client';

import { PlacedDog } from './types';

/**
 * Draws Nika: A black-and-white spotted French Poodle inside her cute Croqueta Shop.
 */
export function drawNikaCroquetaShop(
    ctx: CanvasRenderingContext2D,
    dog: PlacedDog,
    time: number
) {
    ctx.save();
    const bob = Math.sin(dog.animFrame * 1.5) * 1.5;
    const isProducing = dog.actionTimer >= 12.0; // Glowing wind-up before producing croquetas
    const produceScale = isProducing ? 1.0 + Math.sin(time * 0.015) * 0.08 : 1.0;

    ctx.scale(produceScale, produceScale);

    // 1. Shop Wooden Counter & Base
    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Counter Box
    const woodGrad = ctx.createLinearGradient(-22, 6, 22, 22);
    woodGrad.addColorStop(0, '#a16207');
    woodGrad.addColorStop(1, '#713f12');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(-22, 6, 44, 18, 4);
    ctx.fill();

    // Counter Planks Lines
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-22, 12);
    ctx.lineTo(22, 12);
    ctx.moveTo(-22, 18);
    ctx.lineTo(22, 18);
    ctx.stroke();

    // Wooden Countertop Lip
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.roundRect(-24, 4, 48, 5, 2);
    ctx.fill();

    // Golden Bone Sign on Counter Front
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = isProducing ? 12 : 2;
    ctx.beginPath();
    ctx.arc(-6, 15, 2, 0, Math.PI * 2);
    ctx.arc(6, 15, 2, 0, Math.PI * 2);
    ctx.rect(-6, 14, 12, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Jar of Golden Croquetas on the counter (right side)
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(10, -2, 10, 8, 2);
    ctx.fill();
    ctx.stroke();

    // Golden kibbles inside jar
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(13, 2, 1.5, 0, Math.PI * 2);
    ctx.arc(17, 3, 1.5, 0, Math.PI * 2);
    ctx.arc(15, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Striped Canopy / Awning Roof on top of shop
    // Canopy Support Poles (thin gold brass)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 4);
    ctx.lineTo(-20, -20);
    ctx.moveTo(20, 4);
    ctx.lineTo(20, -20);
    ctx.stroke();

    // Striped Awning Roof (Teal & White Stripes)
    const stripeW = 8;
    const awningLeft = -24;
    const awningY = -28;
    const awningH = 12;

    for (let i = 0; i < 6; i++) {
        const isTeal = i % 2 === 0;
        ctx.fillStyle = isTeal ? '#06b6d4' : '#f8fafc';
        ctx.beginPath();
        const sx = awningLeft + i * stripeW;
        ctx.moveTo(sx, awningY);
        ctx.lineTo(sx + stripeW, awningY);
        ctx.lineTo(sx + stripeW - 2, awningY + awningH);
        ctx.lineTo(sx - 2, awningY + awningH);
        ctx.closePath();
        ctx.fill();

        // Scalloped bottom edge
        ctx.beginPath();
        ctx.arc(sx + stripeW / 2 - 1, awningY + awningH, stripeW / 2, 0, Math.PI);
        ctx.fill();
    }

    // 3. NIKA: The Black & White Spotted French Poodle
    ctx.save();
    ctx.translate(0, -6 + bob);

    // Glowing sun aura when producing
    if (isProducing) {
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -2, 18, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Poodle Puffy Ears
    // Left Ear (Black spotted ear)
    ctx.save();
    ctx.translate(-11, -3);
    ctx.rotate(-0.15 + Math.sin(dog.animFrame * 2) * 0.08);
    ctx.fillStyle = '#18181b'; // Black patch ear
    ctx.beginPath();
    ctx.arc(0, 3, 4.5, 0, Math.PI * 2);
    ctx.arc(0, 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right Ear (White fluffy ear)
    ctx.save();
    ctx.translate(11, -3);
    ctx.rotate(0.15 - Math.sin(dog.animFrame * 2) * 0.08);
    ctx.fillStyle = '#f8fafc'; // White fluffy ear
    ctx.beginPath();
    ctx.arc(0, 3, 4.5, 0, Math.PI * 2);
    ctx.arc(0, 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head Base (White Fluff)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, -1, 10, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black Patch around Left Eye (Iconic Nika Dalmatian/Poodle Spot)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(-4.5, -3, 5, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Poodle Crown Pom-Poms (White with tiny black tip)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -9, 4.5, 0, Math.PI * 2);
    ctx.arc(0, -11, 5, 0, Math.PI * 2);
    ctx.arc(4, -9, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Tiny Black Pom-Pom Spot on top
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(3.5, -10, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Chef / Shopkeeper Ribbon (Cute Pink / Cyan Bow)
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.ellipse(-3, -11, 2.5, 1.6, -0.4, 0, Math.PI * 2);
    ctx.ellipse(3, -11, 2.5, 1.6, 0.4, 0, Math.PI * 2);
    ctx.arc(0, -11, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Muzzle & Shiny Black Nose
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 2.5, 4.5, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 1.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Big Sparkling Eyes
    // Left Eye (inside black spot -> white ring)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4.5, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-4.5, -3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5.2, -3.7, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Right Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(4.5, -3, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.8, -3.7, 0.9, 0, Math.PI * 2);
    ctx.arc(5.1, -2.4, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Blushing Rosy Cheeks
    ctx.fillStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.beginPath();
    ctx.arc(-6, 2, 2.5, 0, Math.PI * 2);
    ctx.arc(6, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Joyful Smiling Mouth
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 4, 1.8, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Two little Paws resting on the counter
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(-7, 7, 3, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right paw (black spotted paw!)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(7, 7, 3, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.restore();
}

/**
 * Draws Miel: Slender golden dog standing upright with prominent floppy ears,
 * distinct canine snout, iconic purple harness, shorter tail, and tennis blaster.
 */
export function drawMielShooter(
    ctx: CanvasRenderingContext2D,
    dog: PlacedDog,
    time: number
) {
    ctx.save();
    const bob = Math.sin(dog.animFrame * 2) * 1.5;
    const isShooting = dog.actionTimer < 0.25; // Recoil animation right after shooting
    const recoilX = isShooting ? -3.5 : 0;
    const muzzleFlash = isShooting;

    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Shorter Wagging Dog Tail (Perky curve, shorter as requested)
    ctx.save();
    ctx.translate(-8, 9 + bob);
    const tailWag = Math.sin(time * 0.02) * 0.4;
    ctx.rotate(-0.5 + tailWag);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-6, -4, -10, -10); // Shorter tail curve
    ctx.stroke();
    // Soft fluffy tip
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-10, -10, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Natural Canine Hind Legs & Paws (Digitigrade dog stance)
    // Left Hind Thigh & Paw
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.ellipse(-7, 10, 4, 7, -0.2, 0, Math.PI * 2); // Thigh muscle
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(-8, 12, 5, 10, 2.5); // Lower leg
    ctx.fill();
    // Left Paw with dog toes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-5.5, 22, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-6.5, 20.5);
    ctx.lineTo(-6.5, 23.5);
    ctx.moveTo(-4.5, 20.5);
    ctx.lineTo(-4.5, 23.5);
    ctx.stroke();

    // Right Hind Thigh & Paw
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.ellipse(5, 10, 4, 7, 0.2, 0, Math.PI * 2); // Thigh muscle
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(3, 12, 5, 10, 2.5); // Lower leg
    ctx.fill();
    // Right Paw with dog toes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(5.5, 22, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4.5, 20.5);
    ctx.lineTo(4.5, 23.5);
    ctx.moveTo(6.5, 20.5);
    ctx.lineTo(6.5, 23.5);
    ctx.stroke();

    // 3. Slender Canine Torso & Elegant Neck with Purple Harness
    ctx.save();
    ctx.translate(recoilX, bob);

    // Torso (Golden / Caramel dog body)
    const bodyGrad = ctx.createLinearGradient(-8, -4, 8, 16);
    bodyGrad.addColorStop(0, '#f59e0b');
    bodyGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-8, -2, 16, 16, [6, 6, 7, 7]);
    ctx.fill();

    // Elegant Slender Dog Neck (Distinct from body, giving clear canine silhouette)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-4, -10);
    ctx.lineTo(4, -10);
    ctx.lineTo(5, -2);
    ctx.closePath();
    ctx.fill();

    // White Chest / Throat Fur Patch (from photos)
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(-3, -8);
    ctx.quadraticCurveTo(0, 6, 3, -8);
    ctx.closePath();
    ctx.fill();

    // ─────────────────────────────────────────────────────────────────────────
    // MIEL'S PURPLE TACTICAL HARNESS
    // ─────────────────────────────────────────────────────────────────────────
    // Purple Body Strap
    ctx.fillStyle = '#7e22ce';
    ctx.strokeStyle = '#581c87';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-8, 1, 16, 8, 2.5);
    ctx.fill();
    ctx.stroke();

    // Shoulder Straps reaching around neck
    ctx.strokeStyle = '#7e22ce';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(-3, -4);
    ctx.moveTo(6, 2);
    ctx.lineTo(3, -4);
    ctx.stroke();

    // Silver Reflective Edging
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.lineTo(8, 5);
    ctx.stroke();

    // Front Silver D-Ring
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 6, 2, 0, Math.PI);
    ctx.stroke();

    // ─────────────────────────────────────────────────────────────────────────
    // 4. BIG, HIGHLY VISIBLE CANINE EARS (Drawn first so they frame head)
    // ─────────────────────────────────────────────────────────────────────────
    const earFlap = Math.sin(time * 0.008) * 0.12;

    // LEFT EAR (Large, floppy golden drop-ear clearly visible on side)
    ctx.save();
    ctx.translate(-9, -15);
    ctx.rotate(-0.3 + (isShooting ? -0.25 : earFlap));
    // Outer Ear Flap (Golden-caramel)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(-11, 2, -9, 14);
    ctx.quadraticCurveTo(-4, 16, 2, 8);
    ctx.closePath();
    ctx.fill();
    // Inner Ear Fold / Highlight
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(-4, 7, 3, 5.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // RIGHT EAR (Large, floppy golden drop-ear on right side)
    ctx.save();
    ctx.translate(9, -15);
    ctx.rotate(0.3 + (isShooting ? 0.25 : -earFlap));
    // Outer Ear Flap
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(11, 2, 9, 14);
    ctx.quadraticCurveTo(4, 16, -2, 8);
    ctx.closePath();
    ctx.fill();
    // Inner Ear Fold / Highlight
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(4, 7, 3, 5.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ─────────────────────────────────────────────────────────────────────────
    // 5. CANINE HEAD & PROTRUDING DOG SNOUT (Unmistakably Dog, Not Simian!)
    // ─────────────────────────────────────────────────────────────────────────
    // Dog Skull Base (Warm Honey Golden)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, -13, 9.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Distinct Canine Muzzle / Snout (Pronounced 3D Dog Snout in 3/4 view)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-3, -13);
    ctx.lineTo(6, -11);
    ctx.quadraticCurveTo(9, -7, 6, -5);
    ctx.quadraticCurveTo(0, -4, -3, -7);
    ctx.closePath();
    ctx.fill();

    // Muzzle Bottom Chin / Jaw
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(2, -5, 4.5, 2.5, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Liver / Pinkish-Brown Dog Nose (On top tip of muzzle)
    ctx.fillStyle = '#9f6b53';
    ctx.beginPath();
    ctx.ellipse(6.5, -8.5, 2.8, 2.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Wet Nose Specular Light
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5.8, -9.2, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Canine Nostril slit
    ctx.fillStyle = '#5c2b18';
    ctx.beginPath();
    ctx.arc(7.2, -8.2, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Canine Almond Eyes
    // Left Eye
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(-3.5, -14, 2.5, 3, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92400e'; // Warm Amber
    ctx.beginPath();
    ctx.arc(-3.3, -14, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3.8, -14.6, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Right Eye
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(3, -14, 2.5, 3, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92400e'; // Warm Amber
    ctx.beginPath();
    ctx.arc(3.2, -14, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2.7, -14.6, 0.8, 0, Math.PI * 2);
    ctx.arc(3.7, -13.2, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Happy Dog Smile & Tongue
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(3, -5.5, 2.5, 0.1, Math.PI * 0.9);
    ctx.stroke();

    // Joyful Pink Tongue sticking out
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(3.5, -4, 2, 2.4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // ─────────────────────────────────────────────────────────────────────────
    // 6. HIGH-TECH TENNIS BLASTER GUN (Held in Miel's natural golden paws)
    // ─────────────────────────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(4, 2); // Gun anchor

    // Gun Barrel Body
    const gunGrad = ctx.createLinearGradient(0, -6, 22, 6);
    gunGrad.addColorStop(0, '#0f172a');
    gunGrad.addColorStop(0.5, '#0284c7');
    gunGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = gunGrad;
    ctx.beginPath();
    ctx.roundRect(-2, -5, 24, 10, [3, 6, 6, 3]);
    ctx.fill();

    // Chrome Nozzle
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(20, -6.5, 4.5, 13, 2);
    ctx.fill();
    ctx.stroke();

    // Transparent Hopper with Tennis Balls
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(4, -13, 11, 8, 3);
    ctx.fill();
    ctx.stroke();

    // Tennis balls inside
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(7.5, -9, 2.5, 0, Math.PI * 2);
    ctx.arc(11.5, -9, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Miel's Natural Golden Front Paws
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.8;
    // Left Paw
    ctx.beginPath();
    ctx.ellipse(3, 4, 3.2, 2.4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right Paw
    ctx.beginPath();
    ctx.ellipse(10, -2, 2.8, 2.2, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Muzzle Flash
    if (muzzleFlash) {
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(34, -6);
        ctx.lineTo(31, 0);
        ctx.lineTo(36, 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(26, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore(); // End gun
    ctx.restore(); // End Miel
    ctx.restore();
}

/**
 * Draws Kiaro: The Leader Dog with Sonic Bark / Tennis Cannon.
 */
export function drawKiaroLeader(ctx: CanvasRenderingContext2D, dog: PlacedDog, time: number) {
    ctx.save();
    const bob = Math.sin(dog.animFrame * 2) * 1.5;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 24, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);

    // Body
    const bodyGrad = ctx.createLinearGradient(-10, -4, 10, 16);
    bodyGrad.addColorStop(0, '#ea580c');
    bodyGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-10, 0, 20, 18, [6, 6, 8, 8]);
    ctx.fill();

    // Red Leader Bandana
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.lineTo(10, 2);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(0, -9, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floppy Ears
    [-11, 11].forEach((ex, idx) => {
        ctx.save();
        ctx.translate(ex, -12);
        ctx.rotate((idx === 0 ? -0.2 : 0.2) + Math.sin(time * 0.008) * 0.08);
        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.ellipse(0, 7, 5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Muzzle & Shiny Nose
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(2, -6, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(3, -7, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    [-4, 5].forEach(ex => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ex, -11, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 0.7, -11.7, 1.0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Sonic Cannon Barrel
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(8, -2, 14, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(22, 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draws Sam: The Armored Astronaut Tank Dog with 4000 HP.
 */
export function drawSamTank(ctx: CanvasRenderingContext2D, dog: PlacedDog, time: number) {
    ctx.save();
    const bob = Math.sin(dog.animFrame * 1.2) * 1.0;
    const hpRatio = dog.hp / dog.maxHp;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);

    // Armored Cyber Shield / Tank Body
    const armorGrad = ctx.createLinearGradient(-16, -12, 16, 20);
    armorGrad.addColorStop(0, dog.isArmored ? '#fde047' : '#9333ea');
    armorGrad.addColorStop(1, dog.isArmored ? '#eab308' : '#6b21a8');
    ctx.fillStyle = armorGrad;
    ctx.strokeStyle = dog.isArmored ? '#fef08a' : '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -14, 32, 34, 12);
    ctx.fill();
    ctx.stroke();

    // Spiked Diamond Shield Studs
    [-10, 10].forEach(sx => {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(sx, 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Astronaut Visor / Face Window
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-11, -10, 22, 15, 6);
    ctx.fill();

    // Sam's Face inside helmet
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.ellipse(0, -2, 8, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute Big Tank Eyes (or Bandage if damaged)
    if (hpRatio < 0.35) {
        // Bandage / Tear
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(-8, -5, 16, 4, 1);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(5, 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        [-4, 4].forEach(ex => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex, -3, 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(ex, -3, 1.6, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    ctx.restore();
}

/**
 * Draws Bone Mine: An underground trap with a cute sniffing pup nose.
 */
export function drawBoneMine(ctx: CanvasRenderingContext2D, dog: PlacedDog, time: number) {
    ctx.save();
    const isArmed = dog.state === 'armed';

    // Dirt mound
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, 16, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isArmed) {
        // Red flashing beacon
        ctx.fillStyle = Math.sin(time * 0.015) > 0 ? '#ef4444' : '#f87171';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, -12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Big Bone on top
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.roundRect(-10, 0, 20, 7, 3);
        ctx.fill();
        [-10, 10].forEach(bx => {
            ctx.beginPath();
            ctx.arc(bx, 1, 3.5, 0, Math.PI * 2);
            ctx.arc(bx, 6, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });
    } else {
        // Dirt mound sniffing sprout
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 8, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Draws Love Bomb: A basket of puppies with heart confetti fireworks.
 */
export function drawLoveBomb(ctx: CanvasRenderingContext2D, dog: PlacedDog, time: number) {
    ctx.save();
    const pulse = 1.0 + Math.sin(time * 0.02) * 0.15;
    ctx.scale(pulse, pulse);

    // Heart Bomb Basket
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 4, 18, 0, Math.PI * 2);
    ctx.fill();

    // White Hearts
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', 0, 4);

    ctx.restore();
}

/**
 * Master dispatcher for rendering all dog allies in 2D vector art.
 */
export function drawDogAlly2D(
    ctx: CanvasRenderingContext2D,
    dog: PlacedDog,
    time: number
) {
    switch (dog.type) {
        case 'miel':
            // Nika is the sun producer in her shop (per user request)
            drawNikaCroquetaShop(ctx, dog, time);
            break;
        case 'kiaro':
            // Miel is the two-legged tennis shooter (per user request)
            drawMielShooter(ctx, dog, time);
            break;
        case 'nika':
            // Nika Ice / Frost Poodle
            drawNikaCroquetaShop(ctx, dog, time);
            break;
        case 'sam':
            drawSamTank(ctx, dog, time);
            break;
        case 'boneMine':
            drawBoneMine(ctx, dog, time);
            break;
        case 'loveBomb':
            drawLoveBomb(ctx, dog, time);
            break;
        case 'boxerDog':
            drawKiaroLeader(ctx, dog, time);
            break;
        default:
            drawMielShooter(ctx, dog, time);
            break;
    }
}

