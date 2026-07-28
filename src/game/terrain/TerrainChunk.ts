import Matter from 'matter-js';
import { TerrainMesh } from './TerrainMesh';
import { TerrainConfigType } from '../config/TerrainConfig';
import { DecorationSystem, DecorationItem } from './DecorationSystem';

export class TerrainChunk {
    public chunkIndex: number;
    public startX: number;
    public endX: number;
    public surfacePoints: { x: number; y: number }[] = [];
    public decorations: DecorationItem[] = [];
    public body: Matter.Body | null = null;
    private world: Matter.World;

    constructor(
        world: Matter.World,
        chunkIndex: number,
        mesh: TerrainMesh,
        config: TerrainConfigType,
        decorationSystem?: DecorationSystem
    ) {
        this.world = world;
        this.chunkIndex = chunkIndex;
        this.startX = chunkIndex * config.chunkLength;
        this.endX = this.startX + config.chunkLength;

        this.generate(mesh, config, decorationSystem);
    }

    /**
     * Construye los puntos de superficie, el cuerpo compuesto de física
     * (rectángulos rotados y achaflanados) y las decoraciones visuales.
     * Los chaflanes eliminan los impulsos de esquina entre segmentos y hacen
     * que las ruedas rueden de forma continua.
     */
    private generate(
        mesh: TerrainMesh,
        config: TerrainConfigType,
        decorationSystem?: DecorationSystem
    ) {
        const stepX = config.chunkLength / config.pointsPerChunk;
        this.surfacePoints = [];

        // 1. Muestreo de la superficie. Se toma un punto extra al final para que
        //    el último segmento llegue exactamente al inicio del chunk siguiente.
        for (let i = 0; i <= config.pointsPerChunk; i++) {
            const worldX = this.startX + i * stepX;
            this.surfacePoints.push({ x: worldX, y: mesh.getElevation(worldX, config) });
        }

        const thickness = config.colliderThickness;
        const parts: Matter.Body[] = [];

        // 2. Un rectángulo rotado por segmento de superficie
        for (let i = 0; i < this.surfacePoints.length - 1; i++) {
            const pA = this.surfacePoints[i];
            const pB = this.surfacePoints[i + 1];

            const dx = pB.x - pA.x;
            const dy = pB.y - pA.y;
            const len = Math.hypot(dx, dy);
            const ang = Math.atan2(dy, dx);

            const midX = (pA.x + pB.x) / 2;
            const midY = (pA.y + pB.y) / 2;

            // Normal perpendicular hacia el interior del terreno
            const nx = -Math.sin(ang);
            const ny = Math.cos(ang);

            const cx = midX + nx * (thickness / 2);
            const cy = midY + ny * (thickness / 2);

            parts.push(
                Matter.Bodies.rectangle(cx, cy, len + 1.5, thickness, {
                    isStatic: true,
                    angle: ang,
                    friction: 1.0,
                    frictionStatic: 1.5,
                    restitution: 0.0,
                    slop: 0.05,
                    chamfer: { radius: 3 },
                })
            );
        }

        // 3. Cuerpo estático compuesto para todo el chunk
        if (parts.length > 0) {
            this.body = Matter.Body.create({
                parts,
                isStatic: true,
                friction: 1.0,
                frictionStatic: 1.5,
                restitution: 0.0,
                slop: 0.05,
                label: `terrain_chunk_${this.chunkIndex}`,
            });

            Matter.World.add(this.world, this.body);
        }

        // 4. Decoraciones visuales asociadas
        if (decorationSystem) {
            this.decorations = decorationSystem.generateDecorations(
                this.surfacePoints,
                this.chunkIndex,
                config.seed
            );
        }
    }

    public destroy() {
        if (this.body) {
            Matter.World.remove(this.world, this.body);
            this.body = null;
        }
        this.surfacePoints = [];
        this.decorations = [];
    }
}
