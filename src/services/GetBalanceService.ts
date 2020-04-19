import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

export default class GetBalanceService {
  private transactionsRepository: TransactionsRepository;

  constructor() {
    this.transactionsRepository = getCustomRepository(TransactionsRepository);
  }

  private async getTransactionSumByType(
    type: 'income' | 'outcome',
  ): Promise<number> {
    const transactions = await this.transactionsRepository.find();
    return transactions
      .filter(transaction => transaction.type === type)
      .map(transaction => transaction.value)
      .reduce((total, num) => total + num);
  }

  public async execute(): Promise<Balance> {
    const income = await this.getTransactionSumByType('income');
    const outcome = await this.getTransactionSumByType('outcome');
    const total = income - outcome;

    return { income, outcome, total };
  }
}
