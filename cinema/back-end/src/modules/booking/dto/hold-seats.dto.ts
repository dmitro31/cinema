import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';
import { MAX_SEATS_PER_ORDER } from '../booking.constants';

export class HoldSeatsDto {
  @IsUUID()
  sessionId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SEATS_PER_ORDER)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  seatIds!: string[];
}