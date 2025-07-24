
import { getMockKnex } from '../../test/knex.mock';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { AdjutorService } from '../adjutor/adjutor.service';
import { WalletService } from '../wallet/wallet.service';

describe('UserService', () => {
    let service: UserService;
    let knexMock: any;
    let adjutorServiceMock: Partial<AdjutorService>;
    let walletServiceMock: Partial<WalletService>;

    beforeEach(async () => {
        knexMock = getMockKnex();

        adjutorServiceMock = {
            isBlacklisted: jest.fn().mockResolvedValue(false),
        };

        walletServiceMock = {
            createWallet: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: 'KNEX_CONNECTION', useValue: knexMock },
                { provide: AdjutorService, useValue: adjutorServiceMock },
                { provide: WalletService, useValue: walletServiceMock },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });


    describe('getUserByRemoteId', () => {
        it('should return the user if found', async () => {
            const remoteUserId = 42;
            const mockUser = { id: 1, name: 'John Doe', remote_user_id: 42 };

            // Simulate: knex('users').where(...).first() → mockUser
            knexMock('users').where.mockReturnThis();
            knexMock('users').first.mockResolvedValueOnce(mockUser);

            const result = await service.getUserByRemoteId(remoteUserId);

            expect(knexMock('users').where).toHaveBeenCalledWith({ remote_user_id: remoteUserId });
            expect(knexMock('users').first).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        it('should return undefined if user is not found', async () => {
            const remoteUserId = 99;

            knexMock('users').where.mockReturnThis();
            knexMock('users').first.mockResolvedValueOnce(undefined);

            const result = await service.getUserByRemoteId(remoteUserId);

            expect(knexMock('users').where).toHaveBeenCalledWith({ remote_user_id: remoteUserId });
            expect(knexMock('users').first).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });


    describe('registerUser', () => {
        const dto = { id: 10, name: 'Jane Doe', email: 'jane@example.com' };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return error if user with remote ID already exists', async () => {
            knexMock('users').where.mockReturnThis();
            knexMock('users').first.mockResolvedValueOnce({ ...dto, id: 1 });

            const result = await service.registerUser(dto);

            expect(result).toEqual({
                status: false,
                message: 'User with this remote ID already exists',
            });
        });

        it('should return error if user is blacklisted', async () => {
            // Simulate: user does not exist
            knexMock('users').where.mockReturnThis();
            knexMock('users').first
                .mockResolvedValueOnce(undefined) // first check: no existing user
                .mockResolvedValueOnce(undefined); // second check: after insert

            // Simulate blacklist
            service['adjutorService'].isBlacklisted = jest.fn().mockResolvedValue(true);

            const result = await service.registerUser(dto);

            expect(service['adjutorService'].isBlacklisted).toHaveBeenCalledWith(dto.email);
            expect(result).toEqual({
                status: false,
                message: 'User is blacklisted',
            });
        });

        it('should register a user and create wallet', async () => {
            knexMock('users').where.mockReturnThis();
            knexMock('users').first
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({ ...dto, id: 1 });

            knexMock('users').insert.mockResolvedValueOnce(undefined);

            service['adjutorService'].isBlacklisted = jest.fn().mockResolvedValue(false);
            service['walletService'].createWallet = jest.fn().mockResolvedValue(undefined);

            const result = await service.registerUser(dto);

            expect(knexMock('users').insert).toHaveBeenCalledWith({
                remote_user_id: dto.id,
                name: dto.name,
                email: dto.email,
            });

            expect(service['walletService'].createWallet).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                status: true,
                message: 'User registered successfully',
                data: { ...dto, id: 1 },
            });
        });

        it('should return error if wallet creation fails', async () => {
            knexMock('users').where.mockReturnThis();
            knexMock('users').first
                .mockResolvedValueOnce(undefined) // no existing user
                .mockResolvedValueOnce({ ...dto, id: 2 }); // after insert

            knexMock('users').insert.mockResolvedValueOnce(undefined);

            service['adjutorService'].isBlacklisted = jest.fn().mockResolvedValue(false);
            service['walletService'].createWallet = jest.fn().mockRejectedValue(new Error('wallet failed'));

            const result = await service.registerUser(dto);

            expect(result).toEqual({
                status: false,
                message: 'Wallet creation failed',
            });
        });

        it('should return error if user is not found after insert', async () => {
            knexMock('users').where.mockReturnThis();
            knexMock('users').first
                .mockResolvedValueOnce(undefined) // no existing user
                .mockResolvedValueOnce(undefined); // user not found after insert

            knexMock('users').insert.mockResolvedValueOnce(undefined);

            service['adjutorService'].isBlacklisted = jest.fn().mockResolvedValue(false);

            const result = await service.registerUser(dto);

            expect(result).toEqual({
                status: false,
                message: 'User creation failed',
            });
        });

        it('should handle unexpected exceptions and return a failure message', async () => {
            knexMock('users').where.mockImplementation(() => {
                throw new Error('DB error');
            });

            const result = await service.registerUser(dto);

            expect(result).toEqual({
                status: false,
                message: 'Failed to register user',
            });
        });
    });


});
