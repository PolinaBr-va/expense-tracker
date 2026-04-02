export enum TransactionType {
  Income = 'Доходы',
  Expense = 'Расходы',
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  categoryId?: number;
  date: Date;
}
