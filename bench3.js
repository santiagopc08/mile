const fs = require('fs/promises');
const path = require('path');

async function setup() {
    const dir = path.join(__dirname, 'test-dir-bench3');
    await fs.mkdir(dir, { recursive: true });
    // Simulate typical Mahjong image folder structure (a few categories, some images in each)
    for (let i = 0; i < 20; i++) {
        await fs.mkdir(path.join(dir, `category_${i}`), { recursive: true });
        for (let j = 0; j < 50; j++) {
            await fs.writeFile(path.join(dir, `category_${i}`, `image_${j}.png`), '');
        }
    }
}

async function testCurrent() {
    const directoryPath = path.join(__dirname, 'test-dir-bench3');
    const categories = await fs.readdir(directoryPath, { withFileTypes: true });
    let results = [];
    const promises = [];
    for (const category of categories) {
        if (category.isDirectory()) {
            const subDirPath = path.join(directoryPath, category.name);
            promises.push(fs.readdir(subDirPath).then(files => {
                const validFiles = [];
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
        results = allResults.flat();
    }
    return results.length;
}

async function testBatch() {
    const directoryPath = path.join(__dirname, 'test-dir-bench3');
    const categories = await fs.readdir(directoryPath, { withFileTypes: true });
    let results = [];
    const promises = [];

    // Instead of using flat() and pushing promises for everything
    // We can use Promise.all and do parallel flatMap essentially, but with reduced overhead
    for (const category of categories) {
        if (category.isDirectory()) {
            const subDirPath = path.join(directoryPath, category.name);
            promises.push(fs.readdir(subDirPath).then(files => {
                const validFiles = [];
                for (const file of files) {
                    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                        validFiles.push(`/img/${category.name}/${file}`);
                    }
                }
                return validFiles;
            }));
        } else if (category.name.endsWith('.png') || category.name.endsWith('.jpg') || category.name.endsWith('.jpeg')) {
            results.push(`/img/${category.name}`);
        }
    }

    if (promises.length > 0) {
        const allResults = await Promise.all(promises);
        for (const res of allResults) {
            for (const file of res) {
                results.push(file);
            }
        }
    }

    return results.length;
}

async function testPromiseAllOpt() {
    const directoryPath = path.join(__dirname, 'test-dir-bench3');
    const categories = await fs.readdir(directoryPath, { withFileTypes: true });
    const results = [];
    const promises = [];

    for (const category of categories) {
        if (category.isDirectory()) {
            const subDirPath = path.join(directoryPath, category.name);
            promises.push(
                fs.readdir(subDirPath).then(files => {
                    for (const file of files) {
                        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                            results.push(`/img/${category.name}/${file}`);
                        }
                    }
                })
            );
        } else if (category.name.endsWith('.png') || category.name.endsWith('.jpg') || category.name.endsWith('.jpeg')) {
            results.push(`/img/${category.name}`);
        }
    }

    if (promises.length > 0) {
        await Promise.all(promises);
    }
    return results.length;
}

async function run() {
    await setup();

    const start1 = performance.now();
    for(let i=0; i<100; i++) await testCurrent();
    const end1 = performance.now();
    console.log("Current time:", end1 - start1);

    const start2 = performance.now();
    for(let i=0; i<100; i++) await testBatch();
    const end2 = performance.now();
    console.log("Batch time:", end2 - start2);

    const start3 = performance.now();
    for(let i=0; i<100; i++) await testPromiseAllOpt();
    const end3 = performance.now();
    console.log("PromiseAll Opt time:", end3 - start3);
}

run();
