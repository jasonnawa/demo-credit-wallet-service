import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { TransactionDirection, TransactionType, TransactionStatus } from './transaction.model';

describe('TransactionService', () => {
  let service: TransactionService;
  let knexMock: any;

  beforeEach(async () => {
    knexMock = {
      insert: jest.fn().mockResolvedValue([1]),
    };
    const knexWrapper = jest.fn().mockReturnValue(knexMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: 'KNEX_CONNECTION', useValue: knexWrapper },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log a transaction successfully', async () => {
    const transactionData = {
      wallet_id: 1,
      type: TransactionType.FUND,
      direction: TransactionDirection.CREDIT,
      amount: 1000,
      status: TransactionStatus.SUCCESS,
      description: 'Test transaction',
    };

    const result = await service.logTransaction(transactionData);

    expect(result).toEqual([1]);
    expect(knexMock.insert).toHaveBeenCalledWith(expect.objectContaining({
      ...transactionData,
      created_at: expect.any(Date),
    }));
  });
});
