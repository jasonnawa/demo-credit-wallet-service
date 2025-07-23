import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Knex } from 'knex';
import { User } from './user.model';

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

    async createUser(name: string, email: string): Promise<{ status: boolean; data?: User }> {
        try {
            await this.knex<User>('users').insert({ name, email });
            let user = await this.knex<User>('users').where({ email }).first();

            if (!user) return { status: false }
            
            return { status: true, data: user };
        } catch (error) {
            throw new InternalServerErrorException('Failed to create user');
        }
    }

}
