import sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

const db = new Database('./regret.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const serialize = () => {
    db.serialize(() => {
        // 1. Create Tables
        db.run(`
      CREATE TABLE IF NOT EXISTS people (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER,
        text TEXT NOT NULL,
        said_at DATE NOT NULL,
        related_ticker TEXT,
        price_then REAL,
        price_now REAL,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES people (id)
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS stock_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        date DATE NOT NULL,
        close REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log('Tables created.');

        // 2. Clear existing data (optional, for idempotency)
        db.run(`DELETE FROM quotes`);
        db.run(`DELETE FROM people`);
        db.run(`DELETE FROM stock_prices`);

        // Helper to generate synthetic price history
        const generatePrices = (ticker, startPrice, startDateStr, days = 400) => {
            const prices = [];
            let price = startPrice;
            let date = new Date(startDateStr);

            for (let i = 0; i < days; i++) {
                prices.push({
                    ticker,
                    date: date.toISOString().split('T')[0],
                    close: parseFloat(price.toFixed(2))
                });
                // Random daily change -5% to +5%
                const change = (Math.random() - 0.48) * 0.05;
                price = price * (1 + change);
                date.setDate(date.getDate() + 1);
            }
            return prices;
        };

        // 3. Seed Data
        const people = [
            {
                name: 'Elon Musk',
                slug: 'musk',
                image_url: '/images/elon.png',
                quotes: [
                    { text: "Tesla stock price is too high imo", date: '2020-05-01', ticker: 'TSLA', priceThen: 54.00, priceNow: 450.00 },
                    { text: "You can now buy a Tesla with Bitcoin", date: '2021-03-24', ticker: 'BTC', priceThen: 56000, priceNow: 150000 },
                    { text: "Gamestonk!!", date: '2021-01-26', ticker: 'GME', priceThen: 14.00, priceNow: 25.00 }
                ]
            },
            {
                name: 'Warren Buffett',
                slug: 'buffett',
                image_url: '/images/buffett.png',
                quotes: [
                    { text: "Be fearful when others are greedy, and greedy when others are fearful.", date: '2008-10-16', ticker: 'SPY', priceThen: 90.00, priceNow: 600.00 },
                    { text: "Our favorite holding period is forever.", date: '1988-01-01', ticker: 'KO', priceThen: 2.50, priceNow: 70.00 }
                ]
            },
            {
                name: 'Cathie Wood',
                slug: 'wood',
                image_url: '/images/cathie.png',
                quotes: [
                    { text: "Bitcoin will hit $500,000.", date: '2020-11-20', ticker: 'BTC', priceThen: 18000, priceNow: 150000 },
                    { text: "Tesla could reach $3,000.", date: '2021-03-19', ticker: 'TSLA', priceThen: 220.00, priceNow: 450.00 }
                ]
            }
        ];

        const insertPerson = db.prepare("INSERT INTO people (name, slug, image_url) VALUES (?, ?, ?)");
        const insertQuote = db.prepare("INSERT INTO quotes (person_id, text, said_at, related_ticker, price_then, price_now) VALUES (?, ?, ?, ?, ?, ?)");
        const insertPrice = db.prepare("INSERT INTO stock_prices (ticker, date, close) VALUES (?, ?, ?)");

        // Generate and Insert Prices
        const tickersToGen = [
            { ticker: 'TSLA', startPrice: 50, startDate: '2020-04-01' },
            { ticker: 'BTC', startPrice: 15000, startDate: '2020-10-01' },
            { ticker: 'GME', startPrice: 10, startDate: '2021-01-01' },
            { ticker: 'SPY', startPrice: 85, startDate: '2008-09-01' },
            { ticker: 'KO', startPrice: 2, startDate: '1987-12-01' }
        ];

        db.serialize(() => {
            tickersToGen.forEach(t => {
                const prices = generatePrices(t.ticker, t.startPrice, t.startDate, 400);
                db.run("BEGIN TRANSACTION");
                prices.forEach(p => {
                    insertPrice.run(p.ticker, p.date, p.close);
                });
                db.run("COMMIT");
                console.log(`Seeded prices for ${t.ticker}`);
            });
        });

        people.forEach((person) => {
            insertPerson.run(person.name, person.slug, person.image_url, function (err) {
                if (err) {
                    console.error('Error inserting person:', err);
                    return;
                }
                const personId = this.lastID;
                console.log(`Inserted ${person.name} with ID ${personId}`);

                person.quotes.forEach((quote) => {
                    insertQuote.run(personId, quote.text, quote.date, quote.ticker, quote.priceThen, quote.priceNow);
                });

                // Finalize statements only after we are sure tasks are queued
                if (personId === people.length) { // Very naive check, but fine for sequential
                    // insertPerson.finalize(); // finalized below
                }
            });
        });

        // Since sqlite3 executes serially in serialize(), we can finalize here? 
        // No, the inner callbacks are async. 
        // Actually, db.run/insert are async but serialized. 
        // The issue is likely insertPrice is finalized before the loop finishes or transaction commits.
        // Let's rely on db.close() to cleanup, or check valid state. 

        // Better strategy: DO NOT finalize inside the main flow if we aren't using promises.
        // Or move finalize to the end of the script before close, but we have a race.
        // Removing explicit finalize for this simple script or moving it inside a callback that runs last.

        // Let's remove explicit finalize for now as db.close() will handle cleanup.
        // Or finalize inside a timeout.

        // insertPerson.finalize();
        // insertQuote.finalize();
        // insertPrice.finalize();

        console.log('Seeding completed.');
    });
};

serialize();

// Close connection after a short delay to allow async inserts to finish (sqlite3 is async)
// Better approaches exist (Promises), but for a simple script this works
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Close the database connection.');
    });
}, 1000);
