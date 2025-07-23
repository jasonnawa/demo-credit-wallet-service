import { MiddlewareConsumer, NestModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './database/db.module';
import { UserModule } from './user/user.module';
import { FauxAuthMiddleware } from './middleware/faux-auth.middleware';
import * as morgan from 'morgan';

@Module({
  imports: [DbModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        FauxAuthMiddleware,
        morgan('dev') 
      )
      .forRoutes('*');
  }
}