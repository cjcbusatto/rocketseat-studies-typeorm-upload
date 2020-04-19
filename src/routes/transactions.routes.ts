import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import fileUploadConfig from '../config/fileUpload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import GetBalanceService from '../services/GetBalanceService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const uploadFile = multer(fileUploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (_, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find();

  const balanceService = new GetBalanceService();
  const balance = await balanceService.execute();

  response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category: categoryTitle } = request.body;

  const createTransactionService = new CreateTransactionService();
  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    categoryTitle,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransactionService = new DeleteTransactionService();
  await deleteTransactionService.execute({ id });

  return response.sendStatus(204);
});

transactionsRouter.post(
  '/import',
  uploadFile.single('file'),
  async (request, response) => {
    const createTransactionService = new CreateTransactionService();
    const importTransactionsService = new ImportTransactionsService(
      createTransactionService,
    );

    const transactions = await importTransactionsService.execute({
      filename: request.file.filename,
    });

    return response.json(transactions);
  },
);

export default transactionsRouter;
