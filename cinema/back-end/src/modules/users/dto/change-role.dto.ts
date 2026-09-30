// src/modules/users/dto/change-role.dto.ts
import type { Role } from "../../../generated/prisma/enums";
import { IsIn } from 'class-validator';

export class ChangeRoleDto {
  @IsIn(['USER', 'ADMIN'])
  role!: Role;
}