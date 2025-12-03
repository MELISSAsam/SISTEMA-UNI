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
  UseGuards,
} from '@nestjs/common';
import { MateriasService } from './materias.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('materias')
@UseGuards(JwtAuthGuard)
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) { }

  @Post()
  create(@Body() data: Prisma.MateriaCreateInput) {
    return this.materiasService.create(data);
  }

  @Get()
  findAll() {
    return this.materiasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materiasService.findOne(+id);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() data: Prisma.MateriaUpdateInput) {
    return this.materiasService.update(+id, data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.MateriaUpdateInput) {
    return this.materiasService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materiasService.remove(+id);
  }

  @Options()
  getOptions() {
    return {
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      description: 'Rutas disponibles para /materias',
    };
  }

  @Head()
  check() {
    return;
  }
}
