import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaUsersService } from '../prisma/prisma-users.service';
import { UsuariosController } from './usuarios.controller';

@Module({
    imports: [PrismaModule],
    controllers: [UsuariosController],
    providers: [UsuariosService, PrismaUsersService],
    exports: [UsuariosService],
})
export class UsuariosModule { }
