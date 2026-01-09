import 'dotenv/config';
import { PrismaClient } from '@prisma/client-users';

console.log('Modules imported successfully');
console.log('AUTH_DATABASE_URL:', process.env.AUTH_DATABASE_URL ? 'Defined' : 'Undefined');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.AUTH_DATABASE_URL,
        },
    },
});

async function main() {
    console.log('Connecting...');
    await prisma.$connect();
    console.log('Connected!');
    await prisma.$disconnect();
}

main().catch(e => {
    console.error('Error in main:', e);
});
