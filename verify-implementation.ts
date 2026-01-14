import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ReportsService } from './src/reports/reports.service';
import { PrismaAcademicService } from './src/prisma/prisma-academic.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const reportsService = app.get(ReportsService);
    const academicService = app.get(PrismaAcademicService);

    console.log('--- INICIO DE PRUEBAS ---');

    // Preparar datos de prueba (si es necesario leemos o creamos)
    // Nota: Asumimos que la BD ya tiene datos base o los creamos aquí para probar.
    // Vamos a intentar consultar primero, si falla por vacío, avisamos.

    try {
        // 1. Estudiantes Activos
        console.log('\n1. Listar estudiantes activos:');
        const estudiantes = await reportsService.listarEstudiantesActivos();
        console.log(estudiantes.length > 0 ? estudiantes : 'No hay estudiantes activos para mostrar.');

        // 2. Docentes Multi-Asignatura
        console.log('\n2. Docentes con múltiples asignaturas:');
        const docentes = await reportsService.listarDocentesMultiAsignatura();
        console.log(docentes.length > 0 ? docentes : 'No hay docentes con >1 materia.');

        // 3. Consulta Lógica (Estudiantes Avanzados)
        console.log('\n3. Estudiantes Avanzados (Lógica AND):');
        // Usamos IDs ficticios o reales. Probamos con carrera 1, ciclo 1
        const avanzados = await reportsService.buscarEstudiantesAvanzados(1, 1);
        console.log(avanzados.length > 0 ? avanzados : 'No se encontraron coincidencias (normal si la BD esta vacia).');

        // 4. Reporte Nativo
        console.log('\n4. Reporte Nativo SQL:');
        try {
            const reporte = await reportsService.reporteMatriculasNativo();
            console.log(reporte);
        } catch (e) {
            console.error('Error en reporte nativo (posiblemente falta datos):', e.message);
        }

        // 5. Transacción (Simulada)
        // Para probar la transacción real, necesitamos un estudiante y materia reales.
        // Vamos a buscar uno existente o crear uno temporalmente
        /*
        const estudianteTest = await academicService.estudiante.findFirst();
        const materiaTest = await academicService.materia.findFirst();
        
        if (estudianteTest && materiaTest) {
            console.log(`\n5. Probando matricula para Estudiante ${estudianteTest.id} en Materia ${materiaTest.id}...`);
            try {
                const resultado = await reportsService.matricularEstudiante(estudianteTest.id, materiaTest.id);
                console.log('Resultado transacción:', resultado);
            } catch (e) {
                console.log('Transacción falló (esperado si ya estaba inscrito o sin cupos):', e.message);
            }
        } else {
            console.log('\n5. Saltando prueba de transacción (faltan datos en BD)');
        }
        */

    } catch (error) {
        console.error('Error general durante la prueba:', error);
    } finally {
        await app.close();
        console.log('\n--- FIN DE PRUEBAS ---');
    }
}

bootstrap();
