import { IsNumber, Min } from 'class-validator';

export class WithdrawWalletDto {
  @IsNumber()
  @Min(1, { message: 'Withdrawal amount must be at least 1' })
  amount: number;
}
