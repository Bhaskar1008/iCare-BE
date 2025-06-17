import { BaseRepository } from '@/repository/base.repository';
import { ProjectModel, type IProject } from '@/models/project.model';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { ProjectQueryDto } from './dto/project-query.dto';
import type { IProjectRepository } from './interfaces/project.interface';

export class ProjectRepository
  extends BaseRepository<IProject>
  implements IProjectRepository
{
  constructor() {
    super(ProjectModel);
  }

  public async createProject(data: CreateProjectDto): Promise<IProject> {
    const project = new this.model({
      ...data,
      modules: data.modules.map(module => ({
        moduleId: module.moduleId,
        isActive: module.isActive ?? true,
        config: module.config ?? {},
      })),
    });
    return project.save();
  }

  public async findWithPagination(query: ProjectQueryDto): Promise<{
    projects: IProject[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      projectName,
      projectCode,
      projectStatus,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = { isDeleted: false };

    if (projectName) {
      filter.projectName = { $regex: projectName, $options: 'i' };
    }

    if (projectCode) {
      filter.projectCode = { $regex: projectCode, $options: 'i' };
    }

    if (projectStatus) {
      filter.projectStatus = projectStatus;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [projects, total] = await Promise.all([
      this.model
        .find(filter)
        .populate(
          'modules.moduleId',
          'name code description version isCore permissions',
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return {
      projects,
      total,
      page,
      limit,
    };
  }

  public async findById(id: string): Promise<IProject | null> {
    return this.model
      .findOne({ _id: id, isDeleted: false })
      .populate(
        'modules.moduleId',
        'name code description version isCore permissions',
      )
      .lean();
  }

  public async findByIdAndUpdate(
    id: string,
    data: Partial<CreateProjectDto>,
  ): Promise<IProject | null> {
    const updateData = { ...data };
    if (data.modules) {
      updateData.modules = data.modules.map(module => ({
        moduleId: module.moduleId,
        isActive: module.isActive ?? true,
        config: module.config ?? {},
      }));
    }

    return this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateData },
        { new: true },
      )
      .populate(
        'modules.moduleId',
        'name code description version isCore permissions',
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
