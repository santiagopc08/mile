import { supabase } from '@/lib/supabase';

export interface ArcadeMemory {
    id: string;
    imageUrl: string;
    title: string;
    description?: string;
    date?: string;
    source: 'supabase' | 'local';
}

export interface StylizedPhotoCanvas {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
}

// Curated local fallback memories (Pet crew & shared icons)
const FALLBACK_MEMORIES: ArcadeMemory[] = [
    {
        id: 'pet_miel',
        imageUrl: '/img/pets/Miel.png',
        title: 'Miel · La Reina',
        description: 'Nuestra compañera leal y dulce guardiana.',
        source: 'local'
    },
    {
        id: 'pet_kiaro',
        imageUrl: '/img/pets/Kiaro.png',
        title: 'Kiaro · El Explorador',
        description: 'Siempre curioso y lleno de energía infinita.',
        source: 'local'
    },
    {
        id: 'pet_nika',
        imageUrl: '/img/pets/Nika.png',
        title: 'Nika · Pequeña Traviesa',
        description: 'Alegría pura en cada salto y mirada.',
        source: 'local'
    },
    {
        id: 'pet_sam',
        imageUrl: '/img/pets/Sam.png',
        title: 'Sam · El Sabio',
        description: 'Paciencia y serenidad en cada momento.',
        source: 'local'
    },
    {
        id: 'pet_all',
        imageUrl: '/img/pets/all.png',
        title: 'Toda la Tribu Unida',
        description: 'La manada completa en nuestro espacio seguro.',
        source: 'local'
    }
];

// In-memory cache for processed stylized canvases
const stylizedCache = new Map<string, HTMLCanvasElement>();

/**
 * Fetch couple memories from events DB and local assets
 */
export async function fetchArcadeMemories(): Promise<ArcadeMemory[]> {
    try {
        const { data: eventsData, error } = await supabase
            .from('events')
            .select('id, title, description, date, image_url')
            .not('image_url', 'is', null)
            .order('date', { ascending: false });

        const dbMemories: ArcadeMemory[] = [];
        if (!error && eventsData) {
            eventsData.forEach(e => {
                if (e.image_url && typeof e.image_url === 'string' && e.image_url.trim() !== '') {
                    dbMemories.push({
                        id: e.id ? e.id.toString() : crypto.randomUUID(),
                        imageUrl: e.image_url,
                        title: e.title || 'Momento Inolvidable',
                        description: e.description || undefined,
                        date: e.date || undefined,
                        source: 'supabase'
                    });
                }
            });
        }

        // Also fetch local memories if available
        let localImages: string[] = [];
        try {
            const res = await fetch('/api/mahjong-images');
            if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list)) {
                    localImages = list.filter((url: string) => typeof url === 'string' && url.trim() !== '');
                }
            }
        } catch {
            // Ignore fetch failure
        }

        const extraLocal: ArcadeMemory[] = localImages.map((url, idx) => ({
            id: `local_img_${idx}`,
            imageUrl: url,
            title: 'Recuerdo Compartido',
            source: 'local'
        }));

        const combined = [...dbMemories, ...FALLBACK_MEMORIES, ...extraLocal];
        return combined.length > 0 ? combined : FALLBACK_MEMORIES;
    } catch (e) {
        console.warn('Could not fetch remote arcade memories, using local fallbacks:', e);
        return FALLBACK_MEMORIES;
    }
}

/**
 * Converts a hex color string to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
        clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return { r: 0, g: 240, b: 255 };
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

/**
 * Process an HTMLImageElement with a Duotone Neon + CRT Scanline Cyber-filter
 */
export function createHoloDuotoneCanvas(
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    neonColor = '#00f0ff',
    darkColor = '#05091a',
    addScanlines = true
): HTMLCanvasElement {
    const cacheKey = `${img.src}_${targetWidth}x${targetHeight}_${neonColor}_${darkColor}_${addScanlines}`;
    if (stylizedCache.has(cacheKey)) {
        return stylizedCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    // Draw image covering target dimensions (aspect ratio cover)
    const imgAspect = img.width / img.height;
    const targetAspect = targetWidth / targetHeight;
    let sW = img.width;
    let sH = img.height;
    let sX = 0;
    let sY = 0;

    if (imgAspect > targetAspect) {
        sW = img.height * targetAspect;
        sX = (img.width - sW) / 2;
    } else {
        sH = img.width / targetAspect;
        sY = (img.height - sH) / 2;
    }

    ctx.drawImage(img, sX, sY, sW, sH, 0, 0, targetWidth, targetHeight);

    // Apply Duotone Color Mapping
    const neonRGB = hexToRgb(neonColor);
    const darkRGB = hexToRgb(darkColor);

    try {
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Luminosity formula
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Interpolate between dark base and vibrant neon highlight with contrast curve
            const t = Math.pow(lum, 1.25);
            data[i] = Math.round(darkRGB.r + (neonRGB.r - darkRGB.r) * t);
            data[i + 1] = Math.round(darkRGB.g + (neonRGB.g - darkRGB.g) * t);
            data[i + 2] = Math.round(darkRGB.b + (neonRGB.b - darkRGB.b) * t);
            // Full opacity
            data[i + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);

        // Add subtle scanlines overlay
        if (addScanlines) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            for (let y = 0; y < targetHeight; y += 4) {
                ctx.fillRect(0, y, targetWidth, 1.5);
            }
        }

        // Add subtle vignette
        const vignette = ctx.createRadialGradient(
            targetWidth / 2, targetHeight / 2, targetWidth * 0.35,
            targetWidth / 2, targetHeight / 2, targetWidth * 0.7
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(5, 9, 26, 0.65)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Cyber border frame
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, targetWidth - 2, targetHeight - 2);

        // Corner chamfers / ticks
        ctx.fillStyle = neonColor;
        const tickSize = 10;
        ctx.fillRect(2, 2, tickSize, 2);
        ctx.fillRect(2, 2, 2, tickSize);
        ctx.fillRect(targetWidth - tickSize - 2, 2, tickSize, 2);
        ctx.fillRect(targetWidth - 4, 2, 2, tickSize);
        ctx.fillRect(2, targetHeight - 4, tickSize, 2);
        ctx.fillRect(2, targetHeight - tickSize - 2, 2, tickSize);
        ctx.fillRect(targetWidth - tickSize - 2, targetHeight - 4, tickSize, 2);
        ctx.fillRect(targetWidth - 4, targetHeight - tickSize - 2, 2, tickSize);

    } catch (e) {
        console.warn('Canvas image processing fallback (CORS or taint):', e);
    }

    stylizedCache.set(cacheKey, canvas);
    return canvas;
}
