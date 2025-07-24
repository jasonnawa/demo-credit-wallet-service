// transactions/transaction.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { TransactionDirection, TransactionType, TransactionStatus } from './transaction.model';

@Injectable()
export class TransactionService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async logTransaction(params: {
    wallet_id: number;
    type: TransactionType;
    direction: TransactionDirection;
    amount: number;
    status: TransactionStatus;
    description?: string;
  }) {
    return this.knex('transactions').insert({
      ...params,
      created_at: new Date(),
    });
  }
}
