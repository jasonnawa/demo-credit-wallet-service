import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class WalletService {
    constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) { }

    async createWallet(userId: number): Promise<any> {

        const existing = await this.knex('wallets').where({ user_id: userId }).first();
        if (existing) {
            throw new Error('Wallet already exists for this user');
        }

        const [insertedId] = await this.knex('wallets')
            .insert({
                user_id: userId,
                balance: 0,
                created_at: new Date(),
                updated_at: new Date(),
            })


        const wallet = await this.knex('wallets').where({ id: insertedId }).first();
        return wallet;
    }
}
