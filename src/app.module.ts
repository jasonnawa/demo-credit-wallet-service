import { MiddlewareConsumer, NestModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './database/db.module';
import { UserModule } from './user/user.module';
import { FauxAuthMiddleware } from './middleware/faux-auth.middleware';
import { AdjutorModule } from './adjutor/adjutor.module';
import { WalletModule } from './wallet/wallet.module';
import * as morgan from 'morgan';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DbModule, UserModule, AdjutorModule, WalletModule],
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