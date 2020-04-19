import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  private transactionsRepository: TransactionsRepository;

  constructor() {
    this.transactionsRepository = getCustomRepository(TransactionsRepository);
  }

  public async execute({ id }: Request): Promise<boolean> {
    const transaction = await this.transactionsRepository.findOne(id);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    try {
      await this.transactionsRepository.remove(transaction);

      return true;
    } catch (err) {
      throw new AppError('Error deleting transaction', 500);
    }
  }
}

export default DeleteTransactionService;
