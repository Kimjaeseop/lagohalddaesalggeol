import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const publicDir = path.resolve('public/images');

// Colors for gradients
const gradients = [
    ['#FF416C', '#FF4B2B'], // Red/Orange
    ['#1CB5E0', '#000851'], // Blue/Dark Blue
    ['#00F260', '#0575E6'], // Green/Blue
    ['#232526', '#414345'], // Dark/Grey
    ['#8E2DE2', '#4A00E0'], // Purple
    ['#f12711', '#f5af19'], // Orange/Yellow
    ['#00c6ff', '#0072ff'], // Bright Blue
    ['#11998e', '#38ef7d'], // Green
    ['#DA22FF', '#9733EE'], // Neon Purple
    ['#D4145A', '#FBB03B'], // Warm Red/Orange
    ['#009245', '#FCEE21'], // Lush Green
    ['#662D8C', '#ED1E79']  // Purple/Pink
];

function getGradient(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function createSvg(name, slug) {
    const initials = getInitials(name);
    const [color1, color2] = getGradient(name);

    return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad_${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#grad_${slug})" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="200" fill="white" opacity="0.9">
        ${initials}
    </text>
</svg>`;
}

async function main() {
    console.log('🎨 Generating Avatars for people without images...');

    const people = await prisma.person.findMany({
        where: {
            OR: [
                { imageUrl: '/images/default_user.png' },
                { imageUrl: '' },
                { imageUrl: { contains: 'default' } } // Catch other default variations
            ]
        }
    });

    console.log(`Found ${people.length} people needing avatars.`);

    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    for (const p of people) {
        try {
            const svgContent = createSvg(p.name, p.slug);
            const filename = `${p.slug}.svg`;
            const filepath = path.join(publicDir, filename);
            const dbPath = `/images/${filename}`;

            fs.writeFileSync(filepath, svgContent);
            console.log(`  Generated ${filename}`);

            await prisma.person.update({
                where: { id: p.id },
                data: { imageUrl: dbPath }
            });
            console.log(`  ✅ Updated DB for ${p.name}`);

        } catch (e) {
            console.error(`  ❌ Failed for ${p.name}: ${e.message}`);
        }
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
