import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Knex } from 'knex';
import { User } from './user.model';
import { IRequestUser } from 'src/middleware/interfaces/i-request-user';

@Injectable()
export class UserService {
    constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) { }

    async getAllUsers(): Promise<{ status: boolean; data: User[] }> {
        try {
            const users = await this.knex<User>('users').select('*');
            return { status: true, data: users };
        } catch (error) {
            throw new InternalServerErrorException('Failed to fetch users');
        }
    }

    async registerUser({ id, name, email }: IRequestUser): Promise<{ status: boolean; data?: User }> {
        try {
            await this.knex<User>('users').insert({ remote_user_id: id, name, email, });
            let registeredUser = await this.knex<User>('users').where({ email }).first();

            if (!registeredUser) return { status: false }

            return { status: true, data: registeredUser };
        } catch (error) {
            throw new InternalServerErrorException('Failed to register user');
        }
    }

}
