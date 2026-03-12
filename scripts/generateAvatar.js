import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public/images');

// Colors for gradients
const gradients = [
    ['#FF416C', '#FF4B2B'], // Red/Orange
    ['#1CB5E0', '#000851'], // Blue/Dark Blue
    ['#00F260', '#0575E6'], // Green/Blue
    ['#232526', '#414345'], // Dark/Grey
    ['#8E2DE2', '#4A00E0'], // Purple
    ['#f12711', '#f5af19'], // Orange/Yellow
    ['#00c6ff', '#0072ff'], // Bright Blue
    ['#11998e', '#38ef7d']  // Green
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
    // If name is explicitly "default_user" or "default", return empty (silhouette mode)
    if (name.toLowerCase().includes('default')) return null;

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function createSvg(name, slug) {
    const initials = getInitials(name);
    const [color1, color2] = getGradient(name);

    // Silhouette path (head and shoulders)
    // Simple path for a generic avatar
    const silhouettePath = `
        <path d="M256,256c70.7,0,128-57.3,128-128S326.7,0,256,0S128,57.3,128,128S185.3,256,256,256z M256,320
        c-88.4,0-170.6,41.6-213.3,106.7C32,442.7,42.7,458.7,64,458.7h384c21.3,0,32-16,21.3-32C426.6,361.6,344.4,320,256,320z" 
        fill="white" opacity="0.8" transform="translate(0, 26) scale(1)"/>
    `;

    return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad_${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#grad_${slug})" />
    ${initials ? `
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="200" fill="white" opacity="0.9">
        ${initials}
    </text>
    ` : silhouettePath}
</svg>`;
}

const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node scripts/generateAvatar.js "Name" "slug"');
    console.log('Example: node scripts/generateAvatar.js "John Doe" "johndoe"');
    process.exit(1);
}

const [name, slug] = args;
const svgContent = createSvg(name, slug);
const filePath = path.join(publicDir, `${slug}.svg`);

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(filePath, svgContent);
console.log(`✅ Generated avatar for "${name}": public/images/${slug}.svg`);
