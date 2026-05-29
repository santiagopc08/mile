import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
const fsp = fs.promises;

export async function GET() {
    try {
        const directoryPath = path.join(process.cwd(), 'public', 'img');
        const results: string[] = [];

        try {
            await fsp.access(directoryPath);
        } catch {
            return NextResponse.json(results);
        }

        const categories = await fsp.readdir(directoryPath, { withFileTypes: true });

        const promises = categories.map(async (category) => {
            if (category.isDirectory()) {
                const files = await fsp.readdir(path.join(directoryPath, category.name));
                for (const file of files) {
                    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                        results.push(`/img/${category.name}/${file}`);
                    }
                }
            } else if (category.name.endsWith('.png') || category.name.endsWith('.jpg') || category.name.endsWith('.jpeg')) {
                results.push(`/img/${category.name}`);
            }
        });

        await Promise.all(promises);

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error reading mahjong images directory:', error);
        return NextResponse.json([]);
    }
}
