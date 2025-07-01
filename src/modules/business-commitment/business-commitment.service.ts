import {
  BusinessCommitment,
  type IBusinessCommitment,
} from '../../models/business-commitment.model';
import type { CreateBusinessCommitmentDto } from './dto/create-business-commitment.dto';
import type { UpdateBusinessCommitmentDto } from './dto/update-business-commitment.dto';
import type { FilterBusinessCommitmentDto } from './dto/filter-business-commitment.dto';
import { BadRequestException } from '../../common/exceptions/bad-request.exception';
import { AgentModel } from '@/models/agent.model';
import { NotFoundException } from '@/common/exceptions/not-found.exception';
import type { FilterQuery } from 'mongoose';

export class BusinessCommitmentService {
  private async verifyUsers(agentId: string): Promise<void> {
    const agents = await AgentModel.find({
      _id: { $in: agentId },
      agentStatus: 'active',
    });

    const foundAgentIds = agents.map(a => a._id.toString());
    const notFoundAgent = !foundAgentIds.includes(agentId);

    if (notFoundAgent) {
      throw new NotFoundException('Agent not found');
    }
  }

  async create(createDto: CreateBusinessCommitmentDto): Promise<{
    commitment?: IBusinessCommitment;
    existingCommitment?: IBusinessCommitment;
  }> {
    // Set start and end of the commitment date to check for existing records
    await this.verifyUsers(createDto.agentId);
    const startDate = new Date(createDto.commitmentDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    // Check for existing commitment
    const existingCommitment = await BusinessCommitment.findOne({
      agentId: createDto.agentId,
      commitmentDate: {
        $gte: startDate,
        $lte: endDate,
      },
      isDeleted: false,
    });

    if (existingCommitment) {
      return { existingCommitment };
    }

    // Create new commitment if none exists
    const commitment = new BusinessCommitment({
      ...createDto,
      createdBy: createDto.agentId, // Set createdBy to agentId
    });
    await commitment.save();

    return { commitment };
  }

  async updateCommitmentCount(
    id: string,
    additionalCount: number,
  ): Promise<IBusinessCommitment> {
    await this.verifyUsers(id);
    const commitment = await BusinessCommitment.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!commitment) {
      throw new BadRequestException('Business commitment not found');
    }

    commitment.commitmentCount += additionalCount;
    return await commitment.save();
  }

  async update(
    id: string,
    updateDto: UpdateBusinessCommitmentDto,
  ): Promise<IBusinessCommitment> {
    const commitment = await BusinessCommitment.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!commitment) {
      throw new BadRequestException('Business commitment not found');
    }
    commitment.achievedCount = updateDto.achievedCount;
    return await commitment.save();
  }

  async filter(
    filterDto: FilterBusinessCommitmentDto,
  ): Promise<IBusinessCommitment[]> {
    const query: FilterQuery<IBusinessCommitment> = { isDeleted: false };

    if (filterDto.agentId) {
      query.agentId = filterDto.agentId;
    }

    if (filterDto.fromDate || filterDto.toDate) {
      query.commitmentDate = {};

      if (filterDto.fromDate) {
        query.commitmentDate.$gte = filterDto.fromDate;
      }

      if (filterDto.toDate) {
        query.commitmentDate.$lte = filterDto.toDate;
      }
    }

    return await BusinessCommitment.find(query)
      .populate({
        path: 'agentId',
        select: 'agentCode firstName lastName designationId',
        populate: {
          path: 'designationId',
          select: 'designationName',
        },
      })
      .sort({ commitmentDate: -1 })
      .lean();
  }
}
