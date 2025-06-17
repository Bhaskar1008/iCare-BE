import { BaseRepository } from '@/repository/base.repository';
import { ModuleModel, type IModule } from '@/models/module.model';
import type { CreateModuleDto } from './dto/create-module.dto';
import type { ModuleQueryDto } from './dto/module-query.dto';
import type { IModuleRepository } from './interfaces/module.interface';

export class ModuleRepository
  extends BaseRepository<IModule>
  implements IModuleRepository
{
  constructor() {
    super(ModuleModel);
  }

  public async findWithPagination(query: ModuleQueryDto): Promise<{
    modules: IModule[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      name,
      code,
      isActive,
      isCore,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = { isDeleted: false };

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (code) {
      filter.code = { $regex: code, $options: 'i' };
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (typeof isCore === 'boolean') {
      filter.isCore = isCore;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [modules, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    return {
      modules,
      total,
      page,
      limit,
    };
  }

  public async findById(id: string): Promise<IModule | null> {
    return this.model.findOne({ _id: id, isDeleted: false }).lean();
  }

  public async findByIdAndUpdate(
    id: string,
    data: Partial<CreateModuleDto>,
  ): Promise<IModule | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data },
        { new: true },
      )
      .lean();
  }

  public async findByIdAndDelete(id: string): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
    );
  }
}
