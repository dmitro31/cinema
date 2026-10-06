import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  PayloadTooLargeException,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { POSTER_MAX_BYTES } from "../../common/constants/upload.constants"
import { Roles } from '../../common/decorators/roles.decorator';
import { hasErrorCode } from '../../common/utils/error-code';
import { PostersService } from './posters.service';

type FastifyRequestWithFile = FastifyRequest & {
  file: () => Promise<{
    toBuffer: () => Promise<Buffer>;
  } | undefined>;
};

@Roles('ADMIN')
@Controller('movies')
export class PostersController {
  constructor(private posters: PostersService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':id/poster')
  async upload(@Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequestWithFile) {
    const file = await req.file();
    if (!file) throw new BadRequestException('File is required');

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch (error) {
      if (hasErrorCode(error, 'FST_REQ_FILE_TOO_LARGE')) {
        throw new PayloadTooLargeException(
          `Poster must be smaller than ${POSTER_MAX_BYTES / 1024 / 1024} MB`,
        );
      }
      throw error;
    }

    return this.posters.setPoster(id, buffer);
  }

  @Delete(':id/poster')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.posters.removePoster(id);
  }
}
