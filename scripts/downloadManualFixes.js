import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const targets = [
    { slug: 'bill-gates', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Bill_Gates_2017_%28cropped%29.jpg', ext: '.jpg' },
    { slug: 'jamie-dimon', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Jamie_Dimon%2C_CEO_of_JPMorgan_Chase.jpg', ext: '.jpg' },
    { slug: 'jim-cramer', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Jimcramerphoto_%28cropped%29.jpg', ext: '.jpg' }
];

async function downloadImage(url, filepath) {
    const writer = fs.createWriteStream(filepath);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (e) {
        writer.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        throw e;
    }
}

async function main() {
    console.log('⬇️ Downloading manual fixes...');

    for (const t of targets) {
        try {
            const filename = `${t.slug}${t.ext}`;
            const filepath = path.resolve('public/images', filename);
            const dbPath = `/images/${filename}`;

            console.log(`Downloading ${t.slug} from ${t.url}...`);
            await downloadImage(t.url, filepath);
            console.log(`Saved to ${filepath}`);

            await prisma.person.update({
                where: { slug: t.slug },
                data: { imageUrl: dbPath }
            });
            console.log(`✅ Updated DB for ${t.slug}`);

        } catch (e) {
            console.error(`❌ Failed ${t.slug}: ${e.message}`);
        }
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
