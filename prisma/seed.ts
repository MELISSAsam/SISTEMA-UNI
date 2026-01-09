import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client-users';

// Ensure the environment variable is set
if (!process.env.AUTH_DATABASE_URL) {
    throw new Error('AUTH_DATABASE_URL is not defined in environment variables');
}

const connectionString = process.env.AUTH_DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for some Neon/AWS host environments
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding users database...');

    // Upsert roles
    const adminRole = await prisma.rol.upsert({
        where: { nombre: 'admin' },
        update: {},
        create: { nombre: 'admin' },
    });
    console.log(`Role created/updated: ${adminRole.nombre}`);

    const userRole = await prisma.rol.upsert({
        where: { nombre: 'user' },
        update: {},
        create: { nombre: 'user' },
    });
    console.log(`Role created/updated: ${userRole.nombre}`);

    // Upsert permissions
    const manageUsers = await prisma.permiso.upsert({
        where: { nombre: 'manage_users' },
        update: {},
        create: { nombre: 'manage_users' },
    });
    console.log(`Permission created/updated: ${manageUsers.nombre}`);

    // Create a default admin user
    const adminUser = await prisma.usuario.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: '$2b$10$examplehashedpassword', // replace with a real hash
        },
    });
    console.log(`User created/updated: ${adminUser.email}`);

    console.log('Seed completed successfully');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
