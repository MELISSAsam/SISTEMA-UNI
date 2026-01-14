import { Module } from '@nestjs/common';
import { PrismaUsersService } from './prisma-users.service';
import { PrismaProfilesService } from './prisma-profiles.service';
import { PrismaAcademicService } from './prisma-academic.service';

@Module({
  providers: [PrismaUsersService, PrismaProfilesService, PrismaAcademicService],
  exports: [PrismaUsersService, PrismaProfilesService, PrismaAcademicService],
})
export class PrismaModule { }
