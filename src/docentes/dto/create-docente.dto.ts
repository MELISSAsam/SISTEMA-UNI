import { IsString, IsEmail, IsInt, MinLength } from 'class-validator';

export class CreateDocenteDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  email: string;

  @IsInt({ message: 'El campo carreraId debe ser un número entero' })
  carreraId: number;

  @IsInt({ message: 'El campo especialidadId debe ser un número entero' })
  especialidadId: number;
}
