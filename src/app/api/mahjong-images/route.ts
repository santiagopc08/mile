import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const directoryPath = path.join(process.cwd(), 'public', 'img');
        const results: string[] = [];

        try {
            // Asynchronously check if the directory exists and is accessible
            await fs.access(directoryPath);
            
            // Asynchronously read all subdirectories in public/img
            const categories = await fs.readdir(directoryPath, { withFileTypes: true });

            const promises: Promise<string[]>[] = [];
            for (const category of categories) {
                if (category.isDirectory()) {
                    const subDirPath = path.join(directoryPath, category.name);
                    promises.push(fs.readdir(subDirPath).then(files => {
                        const validFiles: string[] = [];
                        for (const file of files) {
                            if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                                validFiles.push(`/img/${category.name}/${file}`);
                            }
                        }
                        return validFiles;
                    }));
                } else if (category.name.endsWith('.png') || category.name.endsWith('.jpg') || category.name.endsWith('.jpeg')) {
                    promises.push(Promise.resolve([`/img/${category.name}`]));
                }
            }

            if (promises.length > 0) {
                const allResults = await Promise.all(promises);
                for (const res of allResults) {
                    for (const item of res) {
                        results.push(item);
                    }
                }
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
