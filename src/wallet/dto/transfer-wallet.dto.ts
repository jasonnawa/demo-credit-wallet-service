import { Min, IsNumber } from "class-validator";
export class TransferFromWalletDto {
  @IsNumber()
  recipientId: number;

  @IsNumber()
  @Min(1)
  amount: number;
}