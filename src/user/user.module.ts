import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdjutorModule } from 'src/adjutor/adjutor.module';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [AdjutorModule, forwardRef(() => WalletModule)],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
