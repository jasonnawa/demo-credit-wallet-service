import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { Request } from 'express';
import { WithdrawWalletDto } from './dto/withdraw-wallet.dto';
import { TransferFromWalletDto } from './dto/transfer-wallet.dto';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Post('fund')
  async fundWallet(@Body() dto: FundWalletDto, @Req() req: Request) {
    const user = req['user'];
    return this.walletService.fundWallet(user.id, dto.amount);
  }

  @Post('withdraw')
  async withdrawFromWallet(
    @Req() req,
    @Body() dto: WithdrawWalletDto,
  ) {
    const { id } = req['user'];
    const { amount } = dto;

    return this.walletService.withdraw(id, amount);
  }

  @Post('transfer')
async transferFunds(
  @Req() req,
  @Body() body: TransferFromWalletDto
) {
  const user = req.user;
  const { recipientId, amount } = body;

  return this.walletService.transferFunds(user.id, recipientId, amount);
}

}
