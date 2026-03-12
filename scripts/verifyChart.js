import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
    // User requested userDataDir to avoid potential profile/permission issues
    // Using a local temp dir since /tmp might not exist on Windows
    const userDataDir = path.join(__dirname, '..', 'temp_browser_profile');

    console.log('Launching browser with userDataDir:', userDataDir);

    const browser = await puppeteer.launch({
        headless: false, // Run visible to see what happens
        userDataDir: userDataDir,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log('Navigating to localhost:5173...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

        // 1. Click Elon Musk card
        // Selector strategy: Find card containing "Elon Musk"
        console.log('Clicking Elon Musk card...');
        const card = await page.waitForSelector('text/Elon Musk', { timeout: 5000 });
        // Click the parent glass-card. Text node itself might not be clickable or propagates event.
        // Let's click the element handle.
        if (card) {
            await card.click();
        } else {
            throw new Error('Elon Musk card not found');
        }

        // 2. Wait for Detail page
        await page.waitForSelector('.detail-container', { timeout: 5000 });
        console.log('Detail page loaded.');

        // 3. Scroll down to chart
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });

        // 4. Wait for chart
        // Recharts usually creates SVG elements. 
        await page.waitForSelector('.recharts-surface', { timeout: 5000 });

        console.log('Chart found. Attempting magnetic hover...');

        // 5. Find a dot to hover
        // The dots are circles in the Scatter plot.
        // The invisible magnetic dots have r=25. The visible ones have r=6 or 8 (active).
        // Let's find a circle with r="25"
        // Note: Puppeteer selectors for SVG attributes can be tricky.

        // We can just move mouse to center of the chart area and move right slowly to hit a dot.
        const chart = await page.$('.recharts-surface');
        const box = await chart.boundingBox();

        if (box) {
            const startX = box.x + 50;
            const startY = box.y + box.height / 2;

            await page.mouse.move(startX, startY);

            // Move horizontally
            for (let i = 0; i < 200; i += 10) {
                await page.mouse.move(startX + i, startY);
                await new Promise(r => setTimeout(r, 50)); // Wait a bit

                // Check if tooltip appeared
                const tooltip = await page.$('.recharts-tooltip-wrapper');
                if (tooltip) {
                    const visible = await tooltip.isVisible(); // Puppeteer v24 check? or use evaluate
                    const style = await page.evaluate(el => el.style.opacity || el.style.visibility, tooltip);
                    // Recharts tooltip usually works by display or visibility or opacity.

                    // If tooltip content is present
                    const content = await page.$('.recharts-tooltip-wrapper .recharts-default-tooltip');
                    // My CustomTooltip doesn't have default class, it's just a div inside wrapper.

                    // Let's just screenshot if we think we hit something.
                    console.log(`Hovered at ${startX + i}, taking screenshot...`);

                    await page.screenshot({ path: 'chart_hover.png' });
                    console.log('Screenshot saved to chart_hover.png');
                    break;
                }
            }
        }

    } catch (error) {
        console.error('Error during verification:', error);
        await page.screenshot({ path: 'chart_error.png' });
    } finally {
        console.log('Closing browser...');
        await browser.close();
    }
})();
