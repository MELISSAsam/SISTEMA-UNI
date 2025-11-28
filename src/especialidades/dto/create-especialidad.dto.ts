import { IsString, MinLength } from 'class-validator';

export class CreateEspecialidadDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;
}
