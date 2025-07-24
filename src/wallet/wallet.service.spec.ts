import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { TransactionService } from '../transaction/transaction.service';
import { UserService } from '../user/user.service';
import { TransactionDirection, TransactionStatus, TransactionType } from '../transaction/transaction.model';
import { Knex } from 'knex';

describe('WalletService', () => {
    let service: WalletService;
    let knexMock: any;
    let walletTableMock: any;

    beforeEach(async () => {
        walletTableMock = {
            where: jest.fn().mockReturnThis(),
            first: jest.fn(),
            insert: jest.fn(),
        };


        const knexWrapper = jest.fn().mockImplementation((table: string) => {
            if (table === 'wallets') return walletTableMock;
            return null;
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WalletService,
                {
                    provide: 'KNEX_CONNECTION',
                    useValue: knexWrapper,
                },
                {
                    provide: TransactionService,
                    useValue: { logTransaction: jest.fn() },
                },
                {
                    provide: UserService,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<WalletService>(WalletService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createWallet', () => {
        const userId = 123;

        it('should create a wallet if none exists', async () => {
            walletTableMock.first
                .mockResolvedValueOnce(null) // no existing wallet
                .mockResolvedValueOnce({ id: 1, user_id: userId, balance: 0 }); // inserted wallet

            walletTableMock.insert.mockResolvedValueOnce([1]);

            const result = await service.createWallet(userId);

            expect(walletTableMock.where).toHaveBeenCalledWith({ user_id: userId });
            expect(walletTableMock.insert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: userId,
                balance: 0,
                created_at: expect.any(Date),
                updated_at: expect.any(Date),
            }));
            expect(result).toEqual({ id: 1, user_id: userId, balance: 0 });
        });

        it('should throw error if wallet already exists', async () => {
            walletTableMock.first.mockResolvedValueOnce({ id: 1, user_id: userId });

            await expect(service.createWallet(userId)).rejects.toThrow('Wallet already exists for this user');
            expect(walletTableMock.where).toHaveBeenCalledWith({ user_id: userId });
            expect(walletTableMock.insert).not.toHaveBeenCalled();
        });
    });


    describe('fundWallet', () => {
        const remoteUserId = 456;
        const userId = 123;
        const amount = 1000;
        const walletId = 99;

        let knexWalletMock: any;

        beforeEach(() => {
            knexWalletMock = {
                where: jest.fn().mockReturnThis(),
                first: jest.fn(),
                increment: jest.fn(),
            };

            // Override knexMock to return walletMock when table is 'wallets'
            const knexWrapper = jest.fn().mockImplementation((table: string) => {
                if (table === 'wallets') return knexWalletMock;
                return null;
            });

            service = new WalletService(
                knexWrapper as any,
                {
                    logTransaction: jest.fn(),
                } as any,
                {
                    getUserByRemoteId: jest.fn(),
                } as any,
            );
        });

        it('should return error if user not found', async () => {
            jest.spyOn(service['userService'], 'getUserByRemoteId').mockResolvedValueOnce(undefined);

            const result = await service.fundWallet(remoteUserId, amount);

            expect(result).toEqual({ status: false, message: 'User not found' });
        });

        it('should return error if wallet not found', async () => {
            jest.spyOn(service['userService'], 'getUserByRemoteId')
                .mockResolvedValueOnce({ id: userId, email: 'tse', remote_user_id: 244, name: 'test', created_at: new Date() });
            knexWalletMock.first.mockResolvedValueOnce(undefined); // no wallet found

            const result = await service.fundWallet(remoteUserId, amount);

            expect(knexWalletMock.where).toHaveBeenCalledWith({ user_id: userId });
            expect(result).toEqual({ status: false, message: 'Wallet not found' });
        });

        it('should fund wallet and log transaction', async () => {
            jest.spyOn(service['userService'], 'getUserByRemoteId')
                .mockResolvedValueOnce({ id: userId, email: 'tse', remote_user_id: 244, name: 'test', created_at: new Date() });

            // First call to `first()` returns wallet
            knexWalletMock.first
                .mockResolvedValueOnce({ id: walletId, balance: 2000 }) // existing wallet
                .mockResolvedValueOnce({ id: walletId, balance: '3000' }); // updated wallet

            const logTransactionSpy = jest.spyOn(service['transactionService'], 'logTransaction');

            const result = await service.fundWallet(remoteUserId, amount);

            expect(knexWalletMock.increment).toHaveBeenCalledWith('balance', amount);
            expect(logTransactionSpy).toHaveBeenCalledWith({
                wallet_id: walletId,
                type: TransactionType.FUND,
                direction: TransactionDirection.CREDIT,
                amount,
                status: TransactionStatus.SUCCESS,
                description: `Wallet funded with ₦${amount}`,
            });

            expect(result).toEqual({
                status: true,
                message: 'Wallet funded successfully',
                data: { balance: 3000 },
            });
        });
    });


    describe('withdraw', () => {
        const remoteUserId = 123;
        const userId = 99;
        const walletId = 888;
        const currentBalance = '2000';
        const amountToWithdraw = 500;
        const user = { id: userId, email: 'tse', remote_user_id: 244, name: 'test', created_at: new Date() }

        let knexWalletMock: any;

        beforeEach(() => {
            knexWalletMock = {
                where: jest.fn().mockReturnThis(),
                first: jest.fn(),
                update: jest.fn(),
            };

            const knexRawMock = jest.fn().mockImplementation((sql, bindings) => `balance - ${bindings[0]}`);

            const knexWrapper = jest.fn().mockImplementation((table: string) => {
                if (table === 'wallets') return knexWalletMock;
                return { raw: jest.fn().mockReturnValue(`balance - ${amountToWithdraw}`) };
            });

            (knexWrapper as any).raw = knexRawMock

            service = new WalletService(
                knexWrapper as any,
                { logTransaction: jest.fn() } as any,
                { getUserByRemoteId: jest.fn() } as any,
            );
        });

        it('should return error if user not found', async () => {
            jest.spyOn(service['userService'], 'getUserByRemoteId').mockResolvedValueOnce(undefined);

            const result = await service.withdraw(remoteUserId, amountToWithdraw);
            expect(result).toEqual({ status: false, message: 'User not found' });
        });

        it('should return error if wallet not found', async () => {
            jest.spyOn(service['userService'], 'getUserByRemoteId').mockResolvedValueOnce(user);
            knexWalletMock.first.mockResolvedValueOnce(undefined);

            const result = await service.withdraw(remoteUserId, amountToWithdraw);
            expect(result).toEqual({ status: false, message: 'wallet not found' });
        });

        it('should return error if balance is insufficient', async () => {
            jest.spyOn(service['userService'], 'getUserByRemoteId').mockResolvedValueOnce(user);
            knexWalletMock.first.mockResolvedValueOnce({ id: walletId, balance: '200' });

            const result = await service.withdraw(remoteUserId, 500);
            expect(result).toEqual({ status: false, message: 'Insufficient balance' });
        });

        it('should withdraw and log transaction successfully', async () => {
            jest.spyOn(service['userService'], 'getUserByRemoteId').mockResolvedValueOnce(user);

            knexWalletMock.first.mockResolvedValueOnce({ id: walletId, balance: currentBalance });

            const logSpy = jest.spyOn(service['transactionService'], 'logTransaction').mockResolvedValueOnce([]);

            const result = await service.withdraw(remoteUserId, amountToWithdraw);

            expect(knexWalletMock.update).toHaveBeenCalledWith({
                balance: expect.stringContaining(`balance - ${amountToWithdraw}`),
                updated_at: expect.any(Date),
            });

            expect(logSpy).toHaveBeenCalledWith({
                wallet_id: walletId,
                type: TransactionType.WITHDRAW,
                direction: TransactionDirection.DEBIT,
                amount: amountToWithdraw,
                status: TransactionStatus.SUCCESS,
                description: `Withdrawal of ₦${amountToWithdraw}`,
            });

            expect(result).toEqual({
                status: true,
                message: 'Withdrawal successful',
                data: {
                    balance: parseFloat((2000 - amountToWithdraw).toFixed(2)),
                },
            });
        });
    });

    describe('transferFunds', () => {
        let service: WalletService;
        let knexMock: any;
        let trxMock: any;
        let trxResultMock: any;
        let userServiceMock: any;

        beforeEach(() => {
            // Mocks the query builder chain methods
            trxResultMock = {
                where: jest.fn().mockReturnThis(),
                first: jest.fn(),
                update: jest.fn(),
                insert: jest.fn(),
                raw: jest.fn((sql: string, bindings: any[]) => `${sql} ${bindings.join(',')}`),
            };

            // Mocks the trx returned by knex.transaction()
            trxMock = jest.fn().mockImplementation((tableName: string) => {
                if (tableName === 'wallets' || tableName === 'transactions') {
                    return trxResultMock;
                }
            });
            trxMock.raw = jest.fn((sql: string, bindings: any[]) => `${sql} ${bindings.join(',')}`);
            trxMock.commit = jest.fn();
            trxMock.rollback = jest.fn();

            // Mocks knex instance
            knexMock = jest.fn().mockImplementation((table: string) => {
                if (table === 'wallets' || table === 'transactions') return trxResultMock;
                return {};
            });
            knexMock.transaction = jest.fn().mockResolvedValue(trxMock);

            // Mocks UserService
            userServiceMock = {
                getUserByRemoteId: jest
                    .fn()
                    .mockImplementationOnce(async (id) => ({ id: 1 })) // sender
                    .mockImplementationOnce(async (id) => ({ id: 2 })), // recipient
            };

            // Construct WalletService with mocks
            service = new WalletService(knexMock as unknown as Knex, {} as TransactionService, userServiceMock as unknown as UserService);
        });

        it('should transfer funds successfully', async () => {
            // Mock sender and recipient wallets
            trxResultMock.first
                .mockResolvedValueOnce({ id: 11, balance: 1000 }) // sender wallet
                .mockResolvedValueOnce({ id: 22, balance: 500 }); // recipient wallet

            const result = await service.transferFunds(1001, 1002, 300);

            expect(knexMock.transaction).toHaveBeenCalled();
            expect(trxResultMock.update).toHaveBeenCalledTimes(2);
            expect(trxResultMock.insert).toHaveBeenCalledTimes(2);
            expect(trxMock.commit).toHaveBeenCalled();

            expect(result).toEqual({
                status: true,
                message: 'Transfer successful',
                data: { amount: 300 },
            });
        });

        it('should fail if sender and recipient are the same', async () => {
            const result = await service.transferFunds(1001, 1001, 100);
            expect(result).toEqual({
                status: false,
                message: 'Cannot transfer to same account',
            });
        });

        it('should fail if sender or recipient does not exist', async () => {
             userServiceMock.getUserByRemoteId.mockReset(); 
            userServiceMock.getUserByRemoteId
                .mockResolvedValueOnce(undefined) // sender not found
                .mockResolvedValueOnce({ id: 2 }); // recipient found

            const result = await service.transferFunds(1001, 1002, 100);
            expect(result).toEqual({
                status: false,
                message: 'Sender or recipient not found',
            });
        });

        it('should fail if wallet(s) not found', async () => {
            userServiceMock.getUserByRemoteId
                .mockResolvedValueOnce({ id: 1 }) // sender
                .mockResolvedValueOnce({ id: 2 }); // recipient

            trxResultMock.first
                .mockResolvedValueOnce(null) // sender wallet not found

            const result = await service.transferFunds(1001, 1002, 100);
            expect(result).toEqual({
                status: false,
                message: 'wallet(s) not found',
            });
        });

        it('should fail if insufficient funds', async () => {
            userServiceMock.getUserByRemoteId
                .mockResolvedValueOnce({ id: 1 })
                .mockResolvedValueOnce({ id: 2 });

            trxResultMock.first
                .mockResolvedValueOnce({ id: 11, balance: 50 })  // sender wallet
                .mockResolvedValueOnce({ id: 22, balance: 100 }); // recipient wallet

            const result = await service.transferFunds(1001, 1002, 100);
            expect(result).toEqual({
                status: false,
                message: 'Insufficient funds',
            });
        });

        it('should rollback and fail on unexpected error', async () => {
            userServiceMock.getUserByRemoteId
                .mockResolvedValueOnce({ id: 1 })
                .mockResolvedValueOnce({ id: 2 });

            trxResultMock.first
                .mockResolvedValueOnce({ id: 11, balance: 1000 })
                .mockResolvedValueOnce({ id: 22, balance: 100 });

            trxResultMock.update.mockImplementationOnce(() => {
                throw new Error('DB error');
            });

            const result = await service.transferFunds(1001, 1002, 100);
            expect(result).toEqual({
                status: false,
                message: 'Transfer failed',
            });

            expect(trxMock.rollback).toHaveBeenCalled();
        });
    });

});
