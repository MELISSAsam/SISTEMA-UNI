import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Head,
  Options,
  Param,
  Body,
} from '@nestjs/common';
import { EspecialidadesService } from './especialidades.service';
import { Prisma } from '@prisma/client';

@Controller('especialidad')
export class EspecialidadController {
  constructor(private readonly especialidadesService: EspecialidadesService) {}

  // ✅ POST /especialidad
  @Post()
  create(@Body() data: Prisma.EspecialidadCreateInput) {
    return this.especialidadesService.create(data);
  }

  // ✅ GET /especialidad
  @Get()
  findAll() {
    return this.especialidadesService.findAll();
  }

  // ✅ GET /especialidad/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.especialidadesService.findOne(+id);
  }

  // ✅ PUT /especialidad/:id — reemplaza todos los datos
  @Put(':id')
  replace(@Param('id') id: string, @Body() data: Prisma.EspecialidadUpdateInput) {
    return this.especialidadesService.update(+id, data);
  }

  // ✅ PATCH /especialidad/:id — actualiza parcialmente
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.EspecialidadUpdateInput) {
    return this.especialidadesService.update(+id, data);
  }

  // ✅ DELETE /especialidad/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.especialidadesService.remove(+id);
  }

  // ✅ OPTIONS /especialidad
  @Options()
  getOptions() {
    return {
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      description: 'Rutas disponibles para /especialidad',
    };
  }

  // ✅ HEAD /especialidad
  @Head()
  check() {
    return;
  }
}
