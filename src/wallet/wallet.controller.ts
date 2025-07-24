// wallets/wallet.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { Request } from 'express';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('fund')
  async fundWallet(@Body() dto: FundWalletDto, @Req() req: Request) {
    const user = req['user'];
    return this.walletService.fundWallet(user.id, dto.amount);
  }
}
