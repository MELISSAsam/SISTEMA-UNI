export class CreateDocenteDto {
  nombre: string;
  email: string;
  carreraId: number;       // 🔹 ID de la carrera
  especialidadId: number;  // 🔹 ID de la especialidad
}
