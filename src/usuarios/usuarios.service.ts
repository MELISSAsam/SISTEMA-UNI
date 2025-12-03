import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateUsuarioDto) {
        const existingUser = await this.prisma.usuario.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictException('El email ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await this.prisma.usuario.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });

        const { password, ...result } = user;
        return result;
    }

    async findAll() {
        const users = await this.prisma.usuario.findMany();
        return users.map((user) => {
            const { password, ...result } = user;
            return result;
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.usuario.findUnique({
            where: { id },
        });

        if (!user) return null;

        const { password, ...result } = user;
        return result;
    }

    async update(id: number, data: UpdateUsuarioDto) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        const user = await this.prisma.usuario.update({
            where: { id },
            data,
        });

        const { password, ...result } = user;
        return result;
    }

    async remove(id: number) {
        return this.prisma.usuario.delete({
            where: { id },
        });
    }
}
