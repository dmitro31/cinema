import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SeatMapService } from './seat-map.service';

@Controller('sessions')
export class SeatMapController {
  constructor(private seatMap: SeatMapService) {}

  @Public()
  @Get(':id/seats')
  getSeatMap(@Param('id', ParseUUIDPipe) id: string) {
    return this.seatMap.getSeatMap(id);
  }
}