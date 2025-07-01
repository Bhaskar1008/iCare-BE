import { BaseRepository } from '@/repository/base.repository';
import {
  AccessControlModel,
  type IAccessControl,
  type IModuleConfig,
} from '@/models/access-control.model';
import type {
  ModuleConfigDto,
  CreateAccessControlDto,
} from './dto/create-access-control.dto';
import type { AccessControlQueryDto } from './dto/access-control-query.dto';
import type { IAccessControlRepository } from './interfaces/access-control.interface';
import { ModuleModel } from '@/models/module.model';

export class AccessControlRepository
  extends BaseRepository<IAccessControl>
  implements IAccessControlRepository
{
  constructor() {
    super(AccessControlModel);
  }

  public async createAccessControl(
    data: CreateAccessControlDto,
  ): Promise<IAccessControl> {
    const accessControl = new this.model(data);
    return accessControl.save();
  }

  public async findWithPagination(query: AccessControlQueryDto): Promise<{
    accessControls: IAccessControl[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      projectId,
      channelId,
      moduleId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = { isDeleted: false };

    if (projectId) {
      filter.projectId = projectId;
    }

    if (channelId) {
      filter.channelId = channelId;
    }

    if (moduleId) {
      filter.moduleId = moduleId;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [accessControls, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('projectId', 'projectName projectCode')
        .populate('channelId', 'channelName channelCode')
        .populate('moduleId', 'name code')
        .populate('accessControlConfig.roleId', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return {
      accessControls,
      total,
      page,
      limit,
    };
  }

  public async findById(id: string): Promise<IAccessControl | null> {
    return this.model
      .findOne({ _id: id, isDeleted: false })
      .populate('projectId', 'projectName projectCode')
      .populate('channelId', 'channelName channelCode')
      .populate('moduleId', 'name code')
      .populate('accessControlConfig.roleId', 'name code')
      .lean();
  }

  public async findByIdAndUpdate(
    id: string,
    data: Partial<CreateAccessControlDto>,
  ): Promise<IAccessControl | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data },
        { new: true },
      )
      .populate('projectId', 'projectName projectCode')
      .populate('channelId', 'channelName channelCode')
      .populate('moduleId', 'name code')
      .populate('accessControlConfig.roleId', 'name code')
      .lean();
  }

  public async findByProjectAndChannel(
    projectId: string,
    channelId: string,
  ): Promise<IAccessControl | null> {
    return this.model
      .findOne({
        projectId,
        channelId,
        isDeleted: false,
      })
      .populate('moduleConfigs.moduleId', 'name code')
      .populate('moduleConfigs.roleConfigs.roleId', 'roleName roleCode')
      .lean();
  }

  public async updateModuleConfigs(
    projectId: string,
    channelId: string,
    moduleConfigs: IModuleConfig[],
  ): Promise<IAccessControl | null> {
    return this.model
      .findOneAndUpdate(
        {
          projectId,
          channelId,
          isDeleted: false,
        },
        {
          $set: { moduleConfigs },
        },
        { new: true },
      )
      .populate('moduleConfigs.moduleId', 'name code')
      .populate('moduleConfigs.roleConfigs.roleId', 'roleName roleCode')
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

  public async createOrUpdateAccessControl(
    projectId: string,
    channelId: string,
    moduleConfigs: ModuleConfigDto[],
  ): Promise<IAccessControl> {
    const accessControl = await this.model
      .findOneAndUpdate(
        {
          projectId,
          channelId,
          isDeleted: false,
        },
        {
          $set: {
            projectId,
            channelId,
            moduleConfigs: await Promise.all(
              moduleConfigs.map(async config => {
                // Find module by code to get its ID
                const module = await ModuleModel.findOne({
                  _id: config.moduleId,
                })
                  .select('_id')
                  .lean();
                if (!module) {
                  throw new Error(
                    `Module with id ${config.moduleId} not found`,
                  );
                }
                return {
                  moduleId: module._id,
                  roleConfigs: config.rolesAssigned.map(role => ({
                    roleId: role.roleId,
                    status: role.status,
                  })),
                };
              }),
            ),
          },
        },
        {
          new: true,
          upsert: true,
        },
      )
      .populate('moduleConfigs.moduleId', 'name code')
      .populate('moduleConfigs.roleConfigs.roleId', 'roleName roleCode')
      .lean();

    if (!accessControl) {
      throw new Error('Failed to create/update access control configuration');
    }

    return accessControl;
  }
}
