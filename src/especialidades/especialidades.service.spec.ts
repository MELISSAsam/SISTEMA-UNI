import { Test, TestingModule } from '@nestjs/testing';
import { EspecialidadesService } from './especialidades.service';

describe('EspecialidadesService', () => {
  let service: EspecialidadesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EspecialidadesService],
    }).compile();

    service = module.get<EspecialidadesService>(EspecialidadesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
