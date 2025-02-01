import { Injectable } from '@nestjs/common';

import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';



@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  
}
