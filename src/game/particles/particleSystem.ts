export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    fade: number;       // Alfa perdido por segundo
    gravity: number;    // Px/s² hacia abajo
    drag: number;       // Fracción de velocidad conservada por segundo
    shrink: number;     // Fracción de tamaño conservada por segundo
    glow: boolean;
}

const MAX_PARTICLES = 320;

export class ParticleSystem {
    private particles: Particle[] = [];

    private push(p: Particle) {
        // Presupuesto acotado: descarta la más vieja antes que crecer sin límite
        if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
        this.particles.push(p);
    }

    public emit(
        x: number,
        y: number,
        count: number,
        color: string,
        speedScale = 1,
        sizeRange: [number, number] = [3, 8],
        options: Partial<Pick<Particle, 'gravity' | 'fade' | 'drag' | 'shrink' | 'glow'>> = {}
    ) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (60 + Math.random() * 220) * speedScale;

            this.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
                color,
                alpha: 1,
                fade: options.fade ?? 1.6 + Math.random() * 0.9,
                gravity: options.gravity ?? 420,
                drag: options.drag ?? 0.28,
                shrink: options.shrink ?? 0.55,
                glow: options.glow ?? false,
            });
        }
    }

    /** Tierra levantada por la rueda motriz. */
    public emitDirt(x: number, y: number, intensity: number, dirX: number) {
        const count = 1 + Math.floor(intensity * 2);
        for (let i = 0; i < count; i++) {
            this.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 6,
                vx: -dirX * (90 + Math.random() * 240) * intensity,
                vy: -(40 + Math.random() * 170) * intensity,
                size: 2 + Math.random() * 4.5,
                color: Math.random() > 0.45 ? '#6b4f32' : '#8a6a45',
                alpha: 0.85,
                fade: 1.5 + Math.random(),
                gravity: 900,
                drag: 0.4,
                shrink: 0.7,
                glow: false,
            });
        }
    }

    /** Humo del escape. */
    public emitExhaust(x: number, y: number, throttle: number) {
        if (Math.random() > 0.35 + throttle * 0.5) return;
        this.push({
            x,
            y,
            vx: -(30 + Math.random() * 55),
            vy: -(18 + Math.random() * 40),
            size: (throttle > 0.4 ? 5 : 3) + Math.random() * 4,
            color: throttle > 0.6 ? 'rgba(70,64,60,0.55)' : 'rgba(140,140,150,0.4)',
            alpha: 0.5,
            fade: 0.85,
            gravity: -30,
            drag: 0.6,
            shrink: -0.9,   // Negativo: el humo se expande al disiparse
            glow: false,
        });
    }

    /** Polvo del aterrizaje. */
    public emitLandingPuff(x: number, y: number, force: number) {
        const count = Math.min(16, 3 + Math.floor(force * 9));
        for (let i = 0; i < count; i++) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            this.push({
                x: x + (Math.random() - 0.5) * 40,
                y,
                vx: dir * (50 + Math.random() * 170) * force,
                vy: -(20 + Math.random() * 80) * force,
                size: 4 + Math.random() * 7,
                color: 'rgba(196,178,150,0.55)',
                alpha: 0.6,
                fade: 1.5,
                gravity: 120,
                drag: 0.55,
                shrink: -0.5,
                glow: false,
            });
        }
    }

    public emitFuelBurst(x: number, y: number) {
        this.emit(x, y, 20, '#f97316', 1.5, [4, 9], { glow: true, fade: 1.9 });
        this.emit(x, y, 12, '#fbbf24', 1.1, [3, 6], { glow: true, fade: 2.2 });
    }

    public emitCoinBurst(x: number, y: number) {
        this.emit(x, y, 11, '#ffd84d', 1.3, [3, 6.5], { glow: true, fade: 2.1, gravity: 220 });
    }

    public update(deltaSec: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.vy += p.gravity * deltaSec;
            const dragFactor = Math.max(0, 1 - p.drag * deltaSec);
            p.vx *= dragFactor;
            p.vy *= dragFactor;

            p.x += p.vx * deltaSec;
            p.y += p.vy * deltaSec;

            p.alpha -= p.fade * deltaSec;
            p.size = Math.max(0.4, p.size * Math.max(0, 1 - p.shrink * deltaSec));

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    public getParticles(): Particle[] {
        return this.particles;
    }

    public clear() {
        this.particles = [];
    }
}
