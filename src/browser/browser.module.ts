import { Module } from '@nestjs/common';
import { BrowserProtoController } from './browser-proto.controller';

@Module({
  controllers: [BrowserProtoController],
})
export class BrowserModule {}
