import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { WithdrawWalletDto } from './dto/withdraw-wallet.dto';
import { TransferFromWalletDto } from './dto/transfer-wallet.dto';

describe('WalletController', () => {
  let controller: WalletController;
  let service: WalletService;

  beforeEach(() => {
    service = {
      fundWallet: jest.fn(),
      withdraw: jest.fn(),
      transferFunds: jest.fn(),
    } as any;

    controller = new WalletController(service);
  });

  describe('fundWallet', () => {
    it('should call walletService.fundWallet with user ID and amount', async () => {
      const req: any = { user: { id: 1 } };
      const dto: FundWalletDto = { amount: 500 };

      const mockResult = { status: true, message: 'Funded' };
      (service.fundWallet as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.fundWallet(dto, req);

      expect(service.fundWallet).toHaveBeenCalledWith(1, 500);
      expect(result).toEqual(mockResult);
    });
  });

  describe('withdrawFromWallet', () => {
    it('should call walletService.withdraw with user ID and amount', async () => {
      const req: any = { user: { id: 2 } };
      const dto: WithdrawWalletDto = { amount: 200 };

      const mockResult = { status: true, message: 'Withdrawn' };
      (service.withdraw as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.withdrawFromWallet(req, dto);

      expect(service.withdraw).toHaveBeenCalledWith(2, 200);
      expect(result).toEqual(mockResult);
    });
  });

  describe('transferFunds', () => {
    it('should call walletService.transferFunds with correct params', async () => {
      const req: any = { user: { id: 3 } };
      const dto: TransferFromWalletDto = { recipientId: 4, amount: 150 };

      const mockResult = { status: true, message: 'Transferred' };
      (service.transferFunds as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.transferFunds(req, dto);

      expect(service.transferFunds).toHaveBeenCalledWith(3, 4, 150);
      expect(result).toEqual(mockResult);
    });
  });
});
