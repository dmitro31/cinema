import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hasPrismaCode } from '../../common/utils/prisma-errors';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenresService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateGenreDto) {
    try {
      return await this.prisma.genre.create({ data: { name: dto.name } });
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) throw new ConflictException('Genre already exists');
      throw error;
    }
  }

  async update(id: string, dto: UpdateGenreDto) {
    try {
      return await this.prisma.genre.update({
        where: { id },
        data: { name: dto.name ?? undefined },
      });
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) throw new NotFoundException('Genre not found');
      if (hasPrismaCode(error, 'P2002')) throw new ConflictException('Genre already exists');
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.genre.delete({ where: { id } });
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) throw new NotFoundException('Genre not found');
      throw error;
    }
  }

  async assertAllExist(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return;

    const count = await this.prisma.genre.count({ where: { id: { in: unique } } });
    if (count !== unique.length) {
      throw new BadRequestException('Some genres do not exist');
    }
  }
}