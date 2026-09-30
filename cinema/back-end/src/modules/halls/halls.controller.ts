// src/modules/halls/halls.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateHallDto } from './dto/create-hall.dto';
import { UpdateHallDto } from './dto/update-hall.dto';
import { HallsService } from './halls.service';

@Roles('ADMIN')
@Controller('halls')
export class HallsController {
  constructor(private halls: HallsService) {}

  @Get()
  list() {
    return this.halls.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.halls.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateHallDto) {
    return this.halls.create(dto);
  }

  @Patch(':id')
  rename(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHallDto) {
    return this.halls.rename(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.halls.remove(id);
  }
}