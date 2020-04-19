import { EntityRepository, Repository } from 'typeorm';

import Category from '../models/Category';

@EntityRepository(Category)
class CategoriesRepository extends Repository<Category> {
  public async findOneByTitle(title: string): Promise<Category | undefined> {
    return this.findOne({ title });
  }
}

export default CategoriesRepository;
