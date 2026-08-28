import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
    if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const directoryPath = path.join(process.cwd(), 'public', 'img');
        const results: string[] = [];

        try {
            // Asynchronously check if the directory exists and is accessible
            await fs.access(directoryPath);
            
            // Asynchronously read all subdirectories in public/img
            const categories = await fs.readdir(directoryPath, { withFileTypes: true });

            const dirs: string[] = [];
            for (const category of categories) {
                if (category.isDirectory()) {
                    dirs.push(category.name);
                } else if (category.name.endsWith('.png') || category.name.endsWith('.jpg') || category.name.endsWith('.jpeg')) {
                    results.push(`/img/${category.name}`);
                }
            }

            const CONCURRENCY_LIMIT = 50;
            for (let i = 0; i < dirs.length; i += CONCURRENCY_LIMIT) {
                // ⚡ Bolt Optimization: Replace batched .slice().map() with direct Promise array to avoid intermediate array allocations
                const batchPromises = [];
                const end = Math.min(i + CONCURRENCY_LIMIT, dirs.length);
                for (let j = i; j < end; j++) {
                    const name = dirs[j];
                    const subDirPath = path.join(directoryPath, name);
                    batchPromises.push(
                        fs.readdir(subDirPath).then(files => {
                            for (let k = 0; k < files.length; k++) {
                                const file = files[k];
                                if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                                    results.push(`/img/${name}/${file}`);
                                }
                            }
                        })
                    );
                }
                await Promise.all(batchPromises);
            }
        } catch (error) {
            // Folder not found or not accessible
            console.warn('img directory is not accessible:', error);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error reading mahjong images directory:', error);
        return NextResponse.json([]);
    }
}
