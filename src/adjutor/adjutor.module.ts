import { Module } from '@nestjs/common';
import { AdjutorService } from './adjutor.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('ADJUTOR_BASE_API_URL'),
        headers: {
          Authorization: `Bearer ${configService.get<string>('ADJUTOR_API_KEY')}`,
        },
      }),
    }),

  ],
  providers: [AdjutorService],
  exports: [AdjutorService],
})
export class AdjutorModule { }
