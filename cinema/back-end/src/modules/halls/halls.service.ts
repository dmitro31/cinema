import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hasPrismaCode } from '../../common/utils/prisma-errors';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateHallDto } from './dto/create-hall.dto';
import { UpdateHallDto } from './dto/update-hall.dto';

const seatsOrder = [{ row: 'asc' as const }, { number: 'asc' as const }];

@Injectable()
export class HallsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.hall.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { seats: true, sessions: true } } },
    });
  }

  async findOne(id: string) {
    const hall = await this.prisma.hall.findUnique({
      where: { id },
      include: { seats: { orderBy: seatsOrder } },
    });
    if (!hall) throw new NotFoundException('Hall not found');
    return hall;
  }

  async assertExists(id: string) {
    const count = await this.prisma.hall.count({ where: { id } });
    if (count === 0) throw new NotFoundException('Hall not found');
  }

  async create(dto: CreateHallDto) {
    const vipRows = new Set(dto.vipRows ?? []);
    if ([...vipRows].some((row) => row > dto.rows)) {
      throw new BadRequestException('vipRows must not exceed rows');
    }

    const seats = Array.from({ length: dto.rows }, (_, rowIndex) => rowIndex + 1).flatMap((row) =>
      Array.from({ length: dto.seatsPerRow }, (_, numberIndex) => ({
        row,
        number: numberIndex + 1,
        type: vipRows.has(row) ? ('VIP' as const) : ('STANDARD' as const),
      })),
    );

    try {
      return await this.prisma.hall.create({
        data: {
          name: dto.name,
          rows: dto.rows,
          seatsPerRow: dto.seatsPerRow,
          seats: { createMany: { data: seats } },
        },
        include: { seats: { orderBy: seatsOrder } },
      });
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) throw new ConflictException('Hall name is already used');
      throw error;
    }
  }

  async rename(id: string, dto: UpdateHallDto) {
    try {
      return await this.prisma.hall.update({ where: { id }, data: { name: dto.name } });
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) throw new NotFoundException('Hall not found');
      if (hasPrismaCode(error, 'P2002')) throw new ConflictException('Hall name is already used');
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.hall.delete({ where: { id } });
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) throw new NotFoundException('Hall not found');
      if (hasPrismaCode(error, 'P2003')) throw new ConflictException('Hall has sessions');
      throw error;
    }
  }
}