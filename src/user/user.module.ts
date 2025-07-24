import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdjutorModule } from 'src/adjutor/adjutor.module';

@Module({
  imports: [AdjutorModule],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
