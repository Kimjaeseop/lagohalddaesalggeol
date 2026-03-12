import sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

const db = new Database('./regret.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

db.serialize(() => {
    db.each("SELECT * FROM people", (err, row) => {
        if (err) {
            console.error(err.message);
        }
        console.log(row);
    });

    db.each("SELECT * FROM quotes", (err, row) => {
        if (err) {
            console.error(err);
        }
        console.log(row);
    });

    db.get("SELECT COUNT(*) as count FROM stock_prices", (err, row) => {
        if (err) console.error(err);
        console.log('Stock Prices Count:', row.count);
    });
});

db.close();
