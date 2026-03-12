import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public/images');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

const people = [
    { name: 'roaringkitty', initials: 'KG', color1: '#FF416C', color2: '#FF4B2B' }, // Red/Orange for Gamestop heat
    { name: 'pelosi', initials: 'NP', color1: '#1CB5E0', color2: '#000851' }, // Blue/Dark Blue for politics/power
    { name: 'chamath', initials: 'CP', color1: '#00F260', color2: '#0575E6' }, // Green/Blue for VC/Growth
    { name: 'burry', initials: 'MB', color1: '#232526', color2: '#414345' }, // Dark/Grey for The Big Short
    { name: 'default_user', initials: '?', color1: '#bdc3c7', color2: '#2c3e50' } // Neutral Grey
];

function createSvg(initials, color1, color2) {
    return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#grad)" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="200" fill="white" opacity="0.9">
        ${initials}
    </text>
</svg>`;
}

console.log('🎨 Generating SVG avatars...');

people.forEach(person => {
    const svgContent = createSvg(person.initials, person.color1, person.color2);
    const filePath = path.join(publicDir, `${person.name}.svg`);
    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ Created ${person.name}.svg`);
});

console.log('✨ All SVGs generated in public/images/');
