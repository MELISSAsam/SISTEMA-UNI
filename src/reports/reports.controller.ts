import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    ParseIntPipe
} from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('estudiantes-activos')
    async listarEstudiantesActivos() {
        return this.reportsService.listarEstudiantesActivos();
    }

    @Get('materias/carrera/:id')
    async obtenerMateriasPorCarrera(@Param('id', ParseIntPipe) id: number) {
        return this.reportsService.obtenerMateriasPorCarrera(id);
    }

    @Get('docentes-multi')
    async listarDocentesMulti() {
        return this.reportsService.listarDocentesMultiAsignatura();
    }

    @Get('matriculas/:estudianteId/:cicloId')
    async verMatriculas(
        @Param('estudianteId', ParseIntPipe) estId: number,
        @Param('cicloId', ParseIntPipe) cicloId: number
    ) {
        return this.reportsService.mostrarMatriculasPorPeriodo(estId, cicloId);
    }

    @Get('estudiantes-avanzados')
    async buscarAvanzados(
        @Query('carreraId', ParseIntPipe) carreraId: number,
        @Query('cicloId', ParseIntPipe) cicloId: number
    ) {
        return this.reportsService.buscarEstudiantesAvanzados(carreraId, cicloId);
    }

    @Get('docentes-filtro')
    async filtrarDocentes() {
        return this.reportsService.filtrarDocentesComplejos();
    }

    @Get('reporte-nativo')
    async reporteNativo() {
        return this.reportsService.reporteMatriculasNativo();
    }

    @Post('matricular')
    async matricular(
        @Body('estudianteId') estudianteId: number,
        @Body('materiaId') materiaId: number
    ) {
        return this.reportsService.matricularEstudiante(estudianteId, materiaId);
    }
}
