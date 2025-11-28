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
import { CarrerasService } from './carreras.service';
import { Prisma } from '@prisma/client';

@Controller('carreras')
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Post()
  create(@Body() data: Prisma.CarreraCreateInput) {
    return this.carrerasService.create(data);
  }

  @Get()
  findAll() {
    return this.carrerasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carrerasService.findOne(+id);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() data: Prisma.CarreraUpdateInput) {
    return this.carrerasService.update(+id, data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.CarreraUpdateInput) {
    return this.carrerasService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carrerasService.remove(+id);
  }

  @Options()
  getOptions() {
    return {
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      description: 'Rutas disponibles para /carreras',
    };
  }

  @Head()
  check() {
    return;
  }
}
