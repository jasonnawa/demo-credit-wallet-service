import { Injectable, Inject, InternalServerErrorException, NotFoundException, forwardRef } from '@nestjs/common';
import { Knex } from 'knex';
import { User } from './user.model';
import { IRequestUser } from 'src/middleware/interfaces/i-request-user';
import { AdjutorService } from 'src/adjutor/adjutor.service';
import { WalletService } from 'src/wallet/wallet.service';
@Injectable()
export class UserService {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly adjutorService: AdjutorService,
     @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) { }

  async getAllUsers(): Promise<{ status: boolean; data: User[] }> {
    try {
      const users = await this.knex<User>('users').select('*');
      return { status: true, data: users };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async registerUser({ id, name, email }: IRequestUser): Promise<{ status: boolean; message?: string; data?: User }> {
    try {

      const isBlacklisted = await this.adjutorService.isBlacklisted(email);
      if (isBlacklisted) {
        return { status: false, message: 'User is blacklisted' };
      }

      await this.knex<User>('users').insert({ remote_user_id: id, name, email });

      const registeredUser = await this.knex<User>('users').where({ email }).first();
      if (!registeredUser) return { status: false, message: 'User creation failed' };

      try {
        await this.walletService.createWallet(registeredUser.id);
      } catch (walletError) {
        //TODO: log error
        console.error('Wallet creation failed:', walletError);
        return { status: false, message: 'Wallet creation failed' };
      }

      return { status: true, data: registeredUser };
    } catch (error) {
      console.error('Registration failed:', error);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

   async getUserByRemoteId(remoteUserId: number): Promise<User | undefined> {
    const user = await this.knex<User>('users')
      .where({ remote_user_id: remoteUserId })
      .first();

    return user;
  }
}
