export interface Transaction {
  id: number;
  wallet_id: number;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  status: TransactionStatus;
  description?: string;
  created_at?: Date;
}

export enum TransactionType {
  FUND = 'FUND',
  TRANSFER = 'TRANSFER',
  WITHDRAW = 'WITHDRAW'
}

export enum TransactionDirection {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}
