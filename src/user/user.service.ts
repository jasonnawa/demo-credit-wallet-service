import { Injectable, Inject, InternalServerErrorException, forwardRef } from '@nestjs/common';
import { Knex } from 'knex';
import { User } from './user.model';
import { AdjutorService } from '../adjutor/adjutor.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateUserDto } from './dto/create-user.dto';
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

  async registerUser({ id, name, email }: CreateUserDto): Promise<{ status: boolean; message?: string; data?: User }> {
    try {

      const existingUser = await this.knex<User>('users').where({ remote_user_id: id }).first();
      if (existingUser) {
        return { status: false, message: 'User with this remote ID already exists' };
      }

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
        return { status: false, message: 'Wallet creation failed' };
      }

      return { status: true, message: 'User registered successfully', data: registeredUser };
    } catch (error) {
      return { status: false, message: 'Failed to register user' };
    }
  }

  async getUserByRemoteId(remoteUserId: number): Promise<User | undefined> {
    const user = await this.knex<User>('users')
      .where({ remote_user_id: remoteUserId })
      .first();

    return user;
  }
}
