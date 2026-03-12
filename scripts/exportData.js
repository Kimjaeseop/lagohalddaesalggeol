import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Database } = sqlite3.verbose();

const db = new Database('./regret.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) console.error(err.message);
});

db.all("SELECT ticker, date, close FROM stock_prices ORDER BY date ASC", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }

    // Group by ticker
    const grouped = {};
    rows.forEach(row => {
        if (!grouped[row.ticker]) {
            grouped[row.ticker] = [];
        }
        grouped[row.ticker].push(row);
    });

    const outputPath = path.join(__dirname, '../src/data/generatedPrices.json');

    fs.writeFileSync(outputPath, JSON.stringify(grouped, null, 2));
    console.log(`Exported ${rows.length} rows to ${outputPath}`);
});

db.close();
