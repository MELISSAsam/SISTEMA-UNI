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
import { CiclosService } from './ciclos.service';
import { Prisma } from '@prisma/client';

@Controller('ciclos')
export class CiclosController {
  constructor(private readonly ciclosService: CiclosService) {}

  @Post()
  create(@Body() data: Prisma.CicloCreateInput) {
    return this.ciclosService.create(data);
  }

  @Get()
  findAll() {
    return this.ciclosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ciclosService.findOne(+id);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() data: Prisma.CicloUpdateInput) {
    return this.ciclosService.update(+id, data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.CicloUpdateInput) {
    return this.ciclosService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ciclosService.remove(+id);
  }

  @Options()
  getOptions() {
    return {
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      description: 'Rutas disponibles para /ciclos',
    };
  }

  @Head()
  check() {
    return;
  }
}
