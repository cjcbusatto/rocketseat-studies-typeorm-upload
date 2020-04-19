import path from 'path';
import fs from 'fs';
import getStream from 'get-stream';
import parse from 'csv-parse';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  filename: string;
}

class ImportTransactionsService {
  private createTransactionService: CreateTransactionService;

  constructor(createTransactionService: CreateTransactionService) {
    this.createTransactionService = createTransactionService;
  }

  async execute({ filename }: Request): Promise<Array<Transaction>> {
    const tmpDir = path.resolve(__dirname, '..', '..', 'tmp');
    const filePath = `${tmpDir}/${filename}`;

    const parseStream = parse({ delimiter: ',' });
    const csvRows: Array<Array<string>> = await getStream.array(
      fs.createReadStream(filePath).pipe(parseStream),
    );

    csvRows.shift();
    const transactions = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const row of csvRows) {
      const [title, type, value, categoryTitle] = row;

      // eslint-disable-next-line no-await-in-loop
      const transaction = await this.createTransactionService.execute({
        title: title.trim(),
        type: type.trim() as 'income' | 'outcome',
        value: Number(value),
        categoryTitle: categoryTitle.trim(),
      });
      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
