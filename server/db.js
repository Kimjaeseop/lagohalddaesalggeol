import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

// PgBouncer(Transaction Pooler) 사용 시 max:1 권장
const pool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
    console.error('❌ Unexpected DB pool error:', err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const initDb = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL via Prisma Adapter.');
    } catch (error) {
        console.error('❌ Prisma Connection Error:', error);
        process.exit(1);
    }
};

export default prisma;
