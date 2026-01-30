const { execSync } = require('child_process');
const path = require('path');

const envVars = {
    ...process.env,
    AUTH_DATABASE_URL: "postgresql://neondb_owner:npg_ea6xmbcn1Ejp@ep-spring-lake-a4g07mjk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    CICLO_CARRERA_DATABASE_URL: "postgresql://neondb_owner:npg_HJvGXxR2LA3B@ep-polished-violet-a44iujcm-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    PROFESORES_DATABASE_URL: "postgresql://neondb_owner:npg_z1frsgQBuP9K@ep-noisy-butterfly-a44dy8yf-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
};

function run(cmd) {
    console.log(`> ${cmd}`);
    try {
        execSync(cmd, { env: envVars, stdio: 'inherit', shell: true });
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
        process.exit(1);
    }
}

console.log('--- Database Setup via Node.js ---');
const prismaBin = path.join('node_modules', '.bin', 'prisma');
const prismaCmd = process.platform === 'win32' ? `"${prismaBin}.cmd"` : prismaBin;

// Generate
run(`${prismaCmd} generate --schema prisma/schema-users.prisma`);
run(`${prismaCmd} generate --schema prisma/schema-academic.prisma`);
run(`${prismaCmd} generate --schema prisma/schema-profiles.prisma`);

// Push
run(`${prismaCmd} db push --schema prisma/schema-users.prisma --accept-data-loss`);
run(`${prismaCmd} db push --schema prisma/schema-academic.prisma --accept-data-loss`);
run(`${prismaCmd} db push --schema prisma/schema-profiles.prisma --accept-data-loss`);

console.log('--- Setup Complete ---');
