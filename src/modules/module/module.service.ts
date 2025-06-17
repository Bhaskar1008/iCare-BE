import type { IModule } from '@/models/module.model';
import { ModuleRepository } from './module.repository';
import type { CreateModuleDto } from './dto/create-module.dto';
import type { ModuleQueryDto } from './dto/module-query.dto';
import type { IModuleService } from './interfaces/module.interface';
import { NotFoundException } from '@/common/exceptions/not-found.exception';

export class ModuleService implements IModuleService {
  private readonly moduleRepository: ModuleRepository;

  constructor() {
    this.moduleRepository = new ModuleRepository();
  }

  public async createModule(data: CreateModuleDto): Promise<IModule> {
    return this.moduleRepository.create(data);
  }

  public async getModules(query: ModuleQueryDto): Promise<{
    modules: IModule[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.moduleRepository.findWithPagination(query);
  }

  public async getModuleById(id: string): Promise<IModule> {
    const module = await this.moduleRepository.findById(id);
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    return module;
  }

  public async updateModule(
    id: string,
    data: Partial<CreateModuleDto>,
  ): Promise<IModule> {
    const module = await this.moduleRepository.findByIdAndUpdate(id, data);
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    return module;
  }

  public async deleteModule(id: string): Promise<void> {
    const module = await this.moduleRepository.findById(id);
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    await this.moduleRepository.findByIdAndDelete(id);
  }
}
