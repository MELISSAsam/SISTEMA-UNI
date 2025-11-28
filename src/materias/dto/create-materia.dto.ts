import { IsString, IsInt, MinLength } from 'class-validator';

export class CreateMateriaDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsString()
  @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
  codigo: string;

  @IsInt({ message: 'El campo docenteId debe ser un número entero' })
  docenteId: number;

  @IsInt({ message: 'El campo carreraId debe ser un número entero' })
  carreraId: number;
}
