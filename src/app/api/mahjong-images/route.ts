import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const directoryPath = path.join(process.cwd(), 'public', 'img');
        const results: string[] = [];

        // Read all subdirectories in public/img
        if (fs.existsSync(directoryPath)) {
            const categories = fs.readdirSync(directoryPath, { withFileTypes: true });
            for (const category of categories) {
                if (category.isDirectory()) {
                    const files = fs.readdirSync(path.join(directoryPath, category.name));
                    for (const file of files) {
                        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                            results.push(`/img/${category.name}/${file}`);
                        }
                    }
                } else if (category.name.endsWith('.png') || category.name.endsWith('.jpg') || category.name.endsWith('.jpeg')) {
                    results.push(`/img/${category.name}`);
                }
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error reading mahjong images directory:', error);
        return NextResponse.json([]);
    }
}
