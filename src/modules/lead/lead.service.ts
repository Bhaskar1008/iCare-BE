import type { ILead } from '@/models/lead.model';
import { Lead } from '@/models/lead.model';
import { BaseService } from '@/services/base.service';
import { BadRequestException } from '@/common/exceptions/bad-request.exception';
import { NotFoundException } from '@/common/exceptions/not-found.exception';
import { determineLeadStatus } from './lead.config';
import type {
  LeadProgress,
  LeadDisposition,
  LeadSubDisposition,
} from './lead.config';
import { AgentModel } from '@/models/agent.model';
import { Types } from 'mongoose';
import { LeadHistory } from '@/models/lead-history.model';
import type { ILeadHistory } from '@/models/lead-history.model';

interface StatusCount {
  _id: string;
  count: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type LeadFilter =
  | 'today'
  | 'all'
  | 'Open'
  | 'Converted'
  | 'Discarded'
  | 'Failed';

interface AdvancedFilterCriteria {
  sortBy?:
    | 'Lead Created date - Newest to oldest'
    | 'Lead Created date - oldest to Newest';
  searchType?: 'Name' | 'Mobile' | 'Lead ID';
  name?: string;
  leadStatus?: string;
  leadType?: string;
  leadProgress?: string;
  leadDisposition?: string;
  leadSubDisposition?: string;
  createdBy: string;
}

interface HistoryChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

class LeadService extends BaseService {
  private async verifyUsers(userIds: Types.ObjectId[]): Promise<void> {
    const agents = await AgentModel.find({
      _id: { $in: userIds },
      agentStatus: 'active',
    });

    const foundAgentIds = agents.map(a => a._id.toString());
    const notFoundAgents = userIds.filter(
      id => !foundAgentIds.includes(id.toString()),
    );

    if (notFoundAgents.length > 0) {
      throw new BadRequestException(
        `Agents not found or inactive: ${notFoundAgents.join(', ')}`,
      );
    }
  }

  private async trackChanges(
    leadId: Types.ObjectId | string,
    changedBy: Types.ObjectId | string,
    changes: HistoryChange[],
    changeType: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE',
  ): Promise<void> {
    const historyEntries = changes.map(change => ({
      leadId: new Types.ObjectId(leadId),
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      changedBy: new Types.ObjectId(changedBy),
      changeType,
    }));

    await LeadHistory.insertMany(historyEntries);
  }

  public async createLead(data: Partial<ILead>): Promise<ILead> {
    try {
      // Verify all users exist and are active
      await this.verifyUsers(
        [data.allocatedTo, data.allocatedBy, data.createdBy].filter(
          (id): id is Types.ObjectId => id !== undefined,
        ),
      );

      // Determine initial lead status
      const status = determineLeadStatus(
        data.leadProgress as LeadProgress,
        data.leadDisposition as LeadDisposition,
        data.leadSubDisposition as LeadSubDisposition,
      );

      // Set the current status and initialize history
      const leadData: Partial<ILead> = {
        ...data,
        currentLeadStatus: status,
        leadStatusHistory: [status],
      };

      const lead = new Lead(leadData);
      const savedLead = await lead.save();

      // Track all initial values in history
      const changes: HistoryChange[] = Object.entries(leadData).map(
        ([field, value]) => ({
          field,
          oldValue: null,
          newValue: value,
        }),
      );

      await this.trackChanges(
        savedLead._id,
        data.createdBy as Types.ObjectId,
        changes,
        'CREATE',
      );

      return savedLead;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  public async updateLead(id: string, data: Partial<ILead>): Promise<ILead> {
    try {
      const lead = await Lead.findById(id);
      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      // If any user IDs are being updated, verify them
      const userIdsToVerify: Types.ObjectId[] = [];
      if (data.allocatedTo) userIdsToVerify.push(data.allocatedTo);
      if (data.allocatedBy) userIdsToVerify.push(data.allocatedBy);
      if (data.createdBy) userIdsToVerify.push(data.createdBy);

      if (userIdsToVerify.length > 0) {
        await this.verifyUsers(userIdsToVerify);
      }

      // Track changes before updating
      const changes: HistoryChange[] = Object.entries(data).map(
        ([field, newValue]) => ({
          field,
          oldValue: lead.get(field),
          newValue,
        }),
      );

      // If status-related fields are being updated
      if (
        data.leadProgress ||
        data.leadDisposition ||
        data.leadSubDisposition
      ) {
        const newStatus = determineLeadStatus(
          (data.leadProgress ?? lead.leadProgress) as LeadProgress,
          (data.leadDisposition ?? lead.leadDisposition) as LeadDisposition,
          (data.leadSubDisposition ??
            lead.leadSubDisposition) as LeadSubDisposition,
        );

        // Update current status and add to history
        data.currentLeadStatus = newStatus;
        if (!lead.leadStatusHistory) {
          lead.leadStatusHistory = [];
        }
        lead.leadStatusHistory.push(newStatus);
        data.leadStatusHistory = lead.leadStatusHistory;

        // Add status change to history tracking
        changes.push({
          field: 'currentLeadStatus',
          oldValue: lead.currentLeadStatus,
          newValue: newStatus,
        });
      }

      const updatedLead = await Lead.findByIdAndUpdate(id, data, {
        new: true,
      }).populate([
        { path: 'allocatedTo', select: 'firstName lastName email agentCode' },
        { path: 'allocatedBy', select: 'firstName lastName email agentCode' },
        { path: 'createdBy', select: 'firstName lastName email agentCode' },
      ]);

      if (!updatedLead) {
        throw new NotFoundException('Lead not found after update');
      }

      // Track all changes in history
      await this.trackChanges(
        updatedLead._id,
        (data.createdBy as Types.ObjectId) || lead.createdBy,
        changes,
      );

      return updatedLead;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  public async changeLeadOwnership(
    leadId: string,
    newAllocatedTo: Types.ObjectId,
    newAllocatedBy: Types.ObjectId,
  ): Promise<ILead> {
    try {
      await this.verifyUsers([newAllocatedTo, newAllocatedBy]);

      const lead = await Lead.findById(leadId);
      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      const changes: HistoryChange[] = [
        {
          field: 'allocatedTo',
          oldValue: lead.allocatedTo,
          newValue: newAllocatedTo,
        },
        {
          field: 'allocatedBy',
          oldValue: lead.allocatedBy,
          newValue: newAllocatedBy,
        },
        {
          field: 'allocatedAt',
          oldValue: lead.allocatedAt,
          newValue: new Date(),
        },
      ];

      // Update ownership
      const updatedLead = await Lead.findByIdAndUpdate(
        leadId,
        {
          allocatedTo: newAllocatedTo,
          allocatedBy: newAllocatedBy,
          allocatedAt: new Date(),
        },
        { new: true },
      ).populate([
        { path: 'allocatedTo', select: 'firstName lastName email agentCode' },
        { path: 'allocatedBy', select: 'firstName lastName email agentCode' },
        { path: 'createdBy', select: 'firstName lastName email agentCode' },
      ]);

      if (!updatedLead) {
        throw new NotFoundException('Lead not found after update');
      }

      // Track changes in history
      await this.trackChanges(updatedLead._id, newAllocatedBy, changes);

      return updatedLead;
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  public async getFilteredLeads(
    filter: LeadFilter,
    page = 1,
    limit = 10,
    createdBy?: string,
  ): Promise<PaginatedResponse<ILead>> {
    try {
      const query: Record<string, unknown> = {};

      // Apply filter
      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        query.createdAt = {
          $gte: today,
          $lt: tomorrow,
        };
      } else if (filter !== 'all') {
        // If filter is a status (Open, Converted, etc.)
        query['currentLeadStatus.name'] = filter;
      }

      // Add agent filter - check if agent is either creator or allocator
      if (createdBy) {
        query.$or = [
          { createdBy: new Types.ObjectId(createdBy) },
          { allocatedBy: new Types.ObjectId(createdBy) },
        ];
      }

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Execute count and find queries in parallel
      const [total, leads] = await Promise.all([
        Lead.countDocuments(query),
        Lead.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate([
            {
              path: 'allocatedTo',
              select: 'firstName lastName email agentCode',
            },
            {
              path: 'allocatedBy',
              select: 'firstName lastName email agentCode',
            },
            { path: 'createdBy', select: 'firstName lastName email agentCode' },
          ]),
      ]);

      return {
        data: leads,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  public async getLeadHistory(
    leadId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<ILeadHistory>> {
    try {
      const query = { leadId: new Types.ObjectId(leadId) };
      const skip = (page - 1) * limit;

      const [total, history] = await Promise.all([
        LeadHistory.countDocuments(query),
        LeadHistory.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('changedBy', 'firstName lastName email'),
      ]);

      return {
        data: history,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  public async getLead(id: string): Promise<ILead> {
    const lead = await Lead.findById(id).populate([
      { path: 'allocatedTo', select: 'firstName lastName email agentCode' },
      { path: 'allocatedBy', select: 'firstName lastName email agentCode' },
      { path: 'createdBy', select: 'firstName lastName email agentCode' },
    ]);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  public async getStatusCount(id: string): Promise<any> {
    const statusCount = await Lead.aggregate([
      {
        $match: {
          $or: [
            { allocatedTo: new Types.ObjectId(id) },
            { createdBy: new Types.ObjectId(id) },
          ],
        },
      },
      {
        $addFields: {
          isToday: {
            $eq: [
              { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              { $dateToString: { format: '%Y-%m-%d', date: new Date() } },
            ],
          },
        },
      },
      {
        $facet: {
          statusCounts: [
            {
              $match: {
                'currentLeadStatus.name': { $ne: null }, // Changed from currentLeadStatus.0.name
              },
            },
            {
              $group: {
                _id: '$currentLeadStatus.name', // Changed from currentLeadStatus.0.name
                count: { $sum: 1 },
              },
            },
          ],
          totalCount: [{ $count: 'total' }],
          todayCount: [{ $match: { isToday: true } }, { $count: 'today' }],
        },
      },
      {
        $project: {
          result: {
            $mergeObjects: [
              {
                $arrayToObject: {
                  $map: {
                    input: '$statusCounts',
                    as: 'status',
                    in: {
                      k: '$$status._id',
                      v: '$$status.count',
                    },
                  },
                },
              },
              {
                All: {
                  $ifNull: [{ $arrayElemAt: ['$totalCount.total', 0] }, 0],
                },
              },
              {
                'For Today': {
                  $ifNull: [{ $arrayElemAt: ['$todayCount.today', 0] }, 0],
                },
              },
            ],
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$result' },
      },
    ]);
    if (!statusCount) {
      throw new NotFoundException('Status count not found');
    }
    return statusCount;
  }

  public async getLeadStatusCounts(
    userId: string,
  ): Promise<Record<string, number>> {
    const counts = await Lead.aggregate<StatusCount>([
      { $match: { allocatedTo: userId } },
      { $group: { _id: '$currentLeadStatus.name', count: { $sum: 1 } } },
    ]);
    return counts.reduce(
      (acc: Record<string, number>, curr: StatusCount) => ({
        ...acc,
        [curr._id]: curr.count,
      }),
      {},
    );
  }

  public async verifyLead(
    emailAddress: string,
    primaryNumber: string,
  ): Promise<ILead | null> {
    const lead = await Lead.findOne({
      $or: [{ emailAddress }, { primaryNumber }],
    });
    if (lead) {
      return lead;
    }
    return null;
  }

  public async getAdvancedFilteredLeads(
    criteria: AdvancedFilterCriteria,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<ILead>> {
    try {
      const query: Record<string, any> = {};

      const andFilters: any[] = [];

      // Handle search by type
      if (criteria.searchType && criteria.name) {
        switch (criteria.searchType) {
          case 'Name': {
            const nameParts = criteria.name.split(' ');
            const nameQuery =
              nameParts.length > 1
                ? [
                    {
                      $and: [
                        { firstName: { $regex: nameParts[0], $options: 'i' } },
                        { lastName: { $regex: nameParts[1], $options: 'i' } },
                      ],
                    },
                    {
                      $and: [
                        { firstName: { $regex: nameParts[1], $options: 'i' } },
                        { lastName: { $regex: nameParts[0], $options: 'i' } },
                      ],
                    },
                  ]
                : [
                    { firstName: { $regex: criteria.name, $options: 'i' } },
                    { lastName: { $regex: criteria.name, $options: 'i' } },
                  ];

            // Add name $or condition as mandatory
            andFilters.push({ $or: nameQuery });
            break;
          }

          case 'Mobile': {
            query.primaryNumber = { $regex: criteria.name };
            break;
          }

          case 'Lead ID': {
            if (Types.ObjectId.isValid(criteria.name)) {
              query._id = new Types.ObjectId(criteria.name);
            }
            break;
          }
        }
      }

      if (criteria.createdBy) {
        andFilters.push({
          $or: [
            { createdBy: new Types.ObjectId(criteria.createdBy) },
            { allocatedTo: new Types.ObjectId(criteria.createdBy) },
          ],
        });
      }
      if (criteria.leadStatus) {
        query['currentLeadStatus.name'] = criteria.leadStatus;
      }
      if (criteria.leadType) {
        query.leadType = criteria.leadType;
      }
      if (criteria.leadProgress) {
        query.leadProgress = criteria.leadProgress;
      }
      if (criteria.leadDisposition) {
        query.leadDisposition = criteria.leadDisposition;
      }
      if (criteria.leadSubDisposition) {
        query.leadSubDisposition = criteria.leadSubDisposition;
      }

      // Combine $and conditions into main query
      if (andFilters.length) {
        query.$and = andFilters;
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Sort order
      const sortOrder =
        criteria.sortBy === 'Lead Created date - oldest to Newest' ? 1 : -1;

      // Fetch data
      const [total, leads] = await Promise.all([
        Lead.countDocuments(query),
        Lead.find(query)
          .sort({ createdAt: sortOrder })
          .skip(skip)
          .limit(limit)
          .populate([
            {
              path: 'allocatedTo',
              select: 'firstName lastName email agentCode',
            },
            {
              path: 'allocatedBy',
              select: 'firstName lastName email agentCode',
            },
            {
              path: 'createdBy',
              select: 'firstName lastName email agentCode',
            },
          ]),
      ]);

      return {
        data: leads,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}

export const leadService = new LeadService();
