import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  private allowedTransactionTypes = ['income', 'outcome'];

  private transactionsRepository: TransactionsRepository;

  private categoriesRepository: CategoriesRepository;

  constructor() {
    this.transactionsRepository = getCustomRepository(TransactionsRepository);
    this.categoriesRepository = getCustomRepository(CategoriesRepository);
  }

  private async hasEnoughFunds(amount: number): Promise<boolean> {
    try {
      const transactions = await this.transactionsRepository.find();

      const currentBalance = transactions
        .map(transaction => {
          if (transaction.type === 'income') {
            return transaction.value;
          }

          if (transaction.type === 'outcome') {
            return -transaction.value;
          }

          // In case we have a wrong typed transaction included in the storage,
          // it should not have any influence in the current balance
          return 0;
        })
        .reduce((total, num) => total + num);

      return currentBalance - amount >= 0;
    } catch {
      return false;
    }
  }

  private async getCategoryIdByTitle(title: string): Promise<string> {
    const category = await this.categoriesRepository.findOneByTitle(title);

    if (!category) {
      const newCategory = this.categoriesRepository.create({ title });
      await this.categoriesRepository.save(newCategory);

      return newCategory.id;
    }

    return category.id;
  }

  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!this.allowedTransactionTypes.includes(type)) {
      throw new AppError('Invalid transaction type', 400);
    }

    if (type === 'outcome' && !(await this.hasEnoughFunds(value))) {
      throw new AppError('Not enough funds to cover the transaction', 400);
    }

    const category_id = await this.getCategoryIdByTitle(category);

    const transaction = this.transactionsRepository.create({
      title,
      type,
      value,
      category: category_id,
    });

    await this.transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
