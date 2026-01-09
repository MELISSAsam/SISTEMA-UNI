#!/usr/bin/env node

/**
 * Setup Script for SISTEMA-UNI
 * Initializes the 3-database architecture
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SISTEMA-UNI Setup Script\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('📝 Please create a .env file with your database URLs.');
    console.log('💡 You can copy .env.example and update the values.\n');
    console.log('Run: cp .env.example .env\n');
    process.exit(1);
}

console.log('✅ .env file found\n');

// Step 1: Generate Prisma clients
console.log('📦 Step 1/3: Generating Prisma clients...\n');

try {
    console.log('  → Generating AUTH client...');
    execSync('npx prisma generate --schema=prisma/auth.prisma', { stdio: 'inherit' });

    console.log('\n  → Generating CICLO-CARRERA client...');
    execSync('npx prisma generate --schema=prisma/ciclo-carrera.prisma', { stdio: 'inherit' });

    console.log('\n  → Generating PROFESORES client...');
    execSync('npx prisma generate --schema=prisma/profesores.prisma', { stdio: 'inherit' });

    console.log('\n✅ All Prisma clients generated successfully!\n');
} catch (error) {
    console.error('❌ Failed to generate Prisma clients');
    console.error('Please check your .env file and database URLs\n');
    process.exit(1);
}

// Step 2: Push schemas to databases
console.log('🗄️  Step 2/3: Pushing schemas to databases...\n');
console.log('⚠️  This will create/update tables in your Neon databases.\n');

try {
    console.log('  → Pushing AUTH schema...');
    execSync('npx prisma db push --schema=prisma/auth.prisma --accept-data-loss', { stdio: 'inherit' });

    console.log('\n  → Pushing CICLO-CARRERA schema...');
    execSync('npx prisma db push --schema=prisma/ciclo-carrera.prisma --accept-data-loss', { stdio: 'inherit' });

    console.log('\n  → Pushing PROFESORES schema...');
    execSync('npx prisma db push --schema=prisma/profesores.prisma --accept-data-loss', { stdio: 'inherit' });

    console.log('\n✅ All schemas pushed successfully!\n');
} catch (error) {
    console.error('❌ Failed to push schemas');
    console.error('Please check your database connections\n');
    process.exit(1);
}

// Step 3: Verify setup
console.log('🔍 Step 3/3: Verifying setup...\n');

const generatedDirs = [
    'generated/auth-client',
    'generated/ciclo-carrera-client',
    'generated/profesores-client'
];

let allGenerated = true;
for (const dir of generatedDirs) {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`  ✅ ${dir}`);
    } else {
        console.log(`  ❌ ${dir} - NOT FOUND`);
        allGenerated = false;
    }
}

console.log('\n');

if (allGenerated) {
    console.log('🎉 Setup completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run start:dev');
    console.log('  2. Check health: http://localhost:3000/health');
    console.log('  3. Open Prisma Studio: npm run db:studio:auth (or :ciclo or :prof)\n');
} else {
    console.log('⚠️  Setup completed with warnings');
    console.log('Some generated clients are missing. Try running:');
    console.log('  npm run db:generate\n');
}
