import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { TransactionStatus, TransactionDirection, TransactionType } from 'src/transaction/transaction.model';
import { Knex } from 'knex';
import { TransactionService } from 'src/transaction/transaction.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class WalletService {
    constructor(
        @Inject('KNEX_CONNECTION') private readonly knex: Knex,
        private readonly transactionService: TransactionService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
    ) { }

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

    async fundWallet(remoteUserId: number, amount: number) {

        const user = await this.userService.getUserByRemoteId(remoteUserId);

        if (!user) return { status: false, message: 'User not found' }

        const wallet = await this.knex('wallets').where({ user_id: user.id }).first();
        if (!wallet) throw new NotFoundException('Wallet not found');

        // Update balance
        await this.knex('wallets')
            .where({ id: wallet.id })
            .increment('balance', amount);

        const updatedWallet = await this.knex('wallets')
            .where({ id: wallet.id })
            .first();

        // Log transaction
        await this.transactionService.logTransaction({
            wallet_id: wallet.id,
            type: TransactionType.FUND,
            direction: TransactionDirection.CREDIT,
            amount,
            status: TransactionStatus.SUCCESS,
            description: `Wallet funded with ₦${amount}`,
        });

        return { status: true, message: 'Wallet funded successfully', balance: updatedWallet.balance };
    }

    async withdraw(remoteUserId: number, amount: number) {
        const user = await this.userService.getUserByRemoteId(remoteUserId);
        if (!user) return { status: false, message: 'User not found' };

        const wallet = await this.knex('wallets').where({ user_id: user.id }).first();
        if (!wallet) return { status: false, message: 'wallet not found' };

        const currentBalance = parseFloat(wallet.balance);
        if (currentBalance < amount) {
            return { status: false, message: 'Insufficient balance' };
        }

        // Deduct balance
        await this.knex('wallets')
            .where({ id: wallet.id })
            .update({
                balance: this.knex.raw('balance - ?', [amount]),
                updated_at: new Date(),
            });


        // Log transaction
        await this.transactionService.logTransaction({
            wallet_id: wallet.id,
            type: TransactionType.WITHDRAW,
            direction: TransactionDirection.DEBIT,
            amount,
            status: TransactionStatus.SUCCESS,
            description: `Withdrawal of ₦${amount}`,
        });

        return {
            status: true,
            message: 'Withdrawal successful',
            balance: currentBalance - amount,
        };
    }

    async transferFunds(senderRemoteId: number, recipientRemoteId: number, amount: number) {
        const trx = await this.knex.transaction();
        try {
            if (senderRemoteId === recipientRemoteId) return { status: false, message: 'Cannot transfer to same account' }
            const sender = await this.userService.getUserByRemoteId(senderRemoteId);
            const recipient = await this.userService.getUserByRemoteId(recipientRemoteId);

            if (!sender || !recipient) return { status: false, message: 'Sender or recipient not found' };

            const senderWallet = await trx('wallets').where({ user_id: sender.id }).first();
            const recipientWallet = await trx('wallets').where({ user_id: recipient.id }).first();

            if (!senderWallet || !recipientWallet) return { status: false, message: 'wallet(s) not found' };

            const senderBalance = parseFloat(senderWallet.balance);
            if (senderBalance < amount) return { status: false, message: 'Insufficint funds' };

            // Update sender (debit)
            await trx('wallets')
                .where({ id: senderWallet.id })
                .update({
                    balance: trx.raw('balance - ?', [amount]),
                    updated_at: new Date(),
                });

            // Update recipient (credit)
            await trx('wallets')
                .where({ id: recipientWallet.id })
                .update({
                    balance: trx.raw('balance + ?', [amount]),
                    updated_at: new Date(),
                });

            // Log debit transaction
            await trx('transactions').insert({
                wallet_id: senderWallet.id,
                type: TransactionType.TRANSFER,
                direction: TransactionDirection.DEBIT,
                amount,
                status: TransactionStatus.SUCCESS,
                description: `Transferred ₦${amount} to user ${recipientRemoteId}`,
                created_at: new Date(),
            });

            // Log credit transaction
            await trx('transactions').insert({
                wallet_id: recipientWallet.id,
                type: TransactionType.TRANSFER,
                direction: TransactionDirection.CREDIT,
                amount,
                status: TransactionStatus.SUCCESS,
                description: `Received ₦${amount} from user ${senderRemoteId}`,
                created_at: new Date(),
            });

            await trx.commit();

            return {
                status: true,
                message: 'Transfer successful',
                data: amount,
            };
        } catch (error) {
            await trx.rollback();
             return {
                status: false,
                message: 'Transfer failed'
            };
        }
    }

}
