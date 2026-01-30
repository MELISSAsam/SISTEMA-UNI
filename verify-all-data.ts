import 'dotenv/config';
import { PrismaClient as PrismaClientUsers } from '@prisma/client-users';
import { PrismaClient as PrismaClientAcademic } from '@prisma/client-academic';
import { PrismaClient as PrismaClientProfiles } from '@prisma/client-profiles';
// Note: Imports above assume these packages are available in node_modules as seen in the file listing.
// If not, we might need to rely on relative paths to generated clients, but let's try this first.

async function main() {
    console.log('--- Verifying Data in All Databases ---');

    console.log('\n1. Checking Users DB...');
    const prismaUsers = new PrismaClientUsers();
    try {
        const userCount = await prismaUsers.usuario.count();
        const roleCount = await prismaUsers.rol.count();
        const permCount = await prismaUsers.permiso.count();
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Roles: ${roleCount}`);
        console.log(`   - Permissions: ${permCount}`);
    } catch (e) {
        console.error('   ! Error checking Users DB:', e.message);
    } finally {
        await prismaUsers.$disconnect();
    }

    console.log('\n2. Checking Academic DB...');
    const prismaAcademic = new PrismaClientAcademic();
    try {
        // Models: Ciclo, Carrera, Estudiante, Materia, Docente
        const cicloCount = await prismaAcademic.ciclo.count();
        const carreraCount = await prismaAcademic.carrera.count();
        const studentCount = await prismaAcademic.estudiante.count();
        const materiaCount = await prismaAcademic.materia.count();
        const docenteCount = await prismaAcademic.docente.count();
        console.log(`   - Ciclos: ${cicloCount}`);
        console.log(`   - Carreras: ${carreraCount}`);
        console.log(`   - Estudiantes: ${studentCount}`);
        console.log(`   - Materias: ${materiaCount}`);
        console.log(`   - Docentes: ${docenteCount}`);
    } catch (e) {
        console.error('   ! Error checking Academic DB:', e.message);
    } finally {
        await prismaAcademic.$disconnect();
    }

    console.log('\n3. Checking Profiles DB...');
    const prismaProfiles = new PrismaClientProfiles();
    try {
        // Models: Docente, Especialidad, Materia
        const docenteProfileCount = await prismaProfiles.docente.count();
        const especialidadCount = await prismaProfiles.especialidad.count();
        const materiaProfileCount = await prismaProfiles.materia.count();
        console.log(`   - Docentes: ${docenteProfileCount}`);
        console.log(`   - Especialidades: ${especialidadCount}`);
        console.log(`   - Materias: ${materiaProfileCount}`);
    } catch (e) {
        console.error('   ! Error checking Profiles DB:', e.message);
    } finally {
        await prismaProfiles.$disconnect();
    }

    console.log('\n--- Verification Completed ---');
}

main();
