import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TransactionModule } from 'src/transaction/transaction.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TransactionModule, forwardRef(() => UserModule)],
  providers: [WalletService],
  exports:[WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
