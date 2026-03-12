import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public/images');

const images = [
    {
        name: 'Nancy Pelosi',
        slug: 'pelosi',
        url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Official_photo_of_Speaker_Nancy_Pelosi_in_2019.jpg',
        ext: '.jpg'
    },
    {
        name: 'Chamath Palihapitiya',
        slug: 'chamath',
        url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Chamath_Palihapitiya_in_2025.jpg',
        ext: '.jpg'
    },
    {
        name: 'Keith Gill',
        slug: 'roaringkitty',
        url: 'https://i.kym-cdn.com/entries/icons/original/000/049/732/roaring-kitty.jpg',
        ext: '.jpg'
    },
    {
        name: 'Michael Burry',
        slug: 'burry',
        url: 'https://substackcdn.com/image/fetch/w_96,c_fill,f_auto,q_auto:best,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F0a33c2a9-0268-450f-90e6-b9a5840a5a3a_256x256.png',
        ext: '.png'
    }
];

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        https.get(url, options, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                console.log(`Redirecting to ${response.headers.location}`);
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                fs.unlink(filepath, () => { });
                reject(new Error(`Failed to consume '${url}': Status Code: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log(`✅ Downloaded: ${filepath}`);
                    resolve();
                });
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

// Download all
Promise.all(images.map(img => {
    const filename = `${img.slug}${img.ext}`;
    const filepath = path.join(publicDir, filename);
    return downloadImage(img.url, filepath);
})).then(() => {
    console.log('All downloads completed.');
}).catch(err => {
    console.error('Error downloading images:', err);
});
