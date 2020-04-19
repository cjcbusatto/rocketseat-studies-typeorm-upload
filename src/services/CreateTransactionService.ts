import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  private allowedTransactionTypes = ['income', 'outcome'];

  private transactionsRepository: TransactionsRepository;

  private categoriesRepository: CategoriesRepository;

  constructor() {
    this.transactionsRepository = getCustomRepository(TransactionsRepository);
    this.categoriesRepository = getCustomRepository(CategoriesRepository);
  }

  private async isTransactionPossible(
    type: 'income' | 'outcome',
    amount: number,
  ): Promise<boolean> {
    if (type === 'income') {
      return true;
    }

    const transactions = await this.transactionsRepository.find();
    if (!transactions.length) {
      return false;
    }

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
  }

  private async getCategoryByTitle({
    title,
  }: Pick<Category, 'title'>): Promise<Category> {
    const category = await this.categoriesRepository.findOneByTitle(title);

    if (!category) {
      const newCategory = this.categoriesRepository.create({ title });
      await this.categoriesRepository.save(newCategory);

      return newCategory;
    }

    return category;
  }

  public async execute({
    title,
    value,
    type,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const isTypeAllowed = this.allowedTransactionTypes.includes(type);
    if (!isTypeAllowed) {
      throw new AppError('Invalid transaction type', 400);
    }

    const isTransactionPossible = await this.isTransactionPossible(type, value);
    if (!isTransactionPossible) {
      throw new AppError('Not enough funds to cover the transaction', 400);
    }

    const category = await this.getCategoryByTitle({
      title: categoryTitle,
    });

    const transaction = this.transactionsRepository.create({
      title: title.trim(),
      type: type.trim(),
      value: Number(value),
      category: category.id,
    });

    await this.transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
