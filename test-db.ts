import 'dotenv/config';
import { Client } from 'pg';

const connectionString = process.env.AUTH_DATABASE_URL;
console.log('Testing connection to:', connectionString?.replace(/:[^:@]*@/, ':****@')); // Hide password

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function test() {
    try {
        await client.connect();
        console.log('Successfully connected to Postgres!');

        const res = await client.query('SELECT NOW()');
        console.log('Current time from DB:', res.rows[0]);

        await client.end();
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

test();
