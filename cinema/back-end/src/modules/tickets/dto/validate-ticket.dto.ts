// src/modules/tickets/dto/validate-ticket.dto.ts
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  @MinLength(10)
  @MaxLength(64)
  code!: string;
}