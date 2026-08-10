import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
    if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const directoryPath = path.join(process.cwd(), 'public', 'img');
        let results: string[] = [];

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
                const batch = dirs.slice(i, i + CONCURRENCY_LIMIT);
                const batchPromises = batch.map(name => {
                    const subDirPath = path.join(directoryPath, name);
                    return fs.readdir(subDirPath).then(files => {
                        for (const file of files) {
                            if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                                results.push(`/img/${name}/${file}`);
                            }
                        }
                    });
                });
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
