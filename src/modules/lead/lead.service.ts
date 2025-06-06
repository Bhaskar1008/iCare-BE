import { Types } from 'mongoose';
import { LeadModel, type ILead } from '@/models/lead.model';
import { LeadConfigurationModel } from '@/models/lead-configuration.model';
import { LeadHistoryModel } from '@/models/lead-history.model';

export class LeadService {
  /**
   * Find the matching lead status name based on progress, disposition, or subDisposition ID
   */
  private findLeadStatusName(config: any, id: string): string {
    const matchingStatus = config.leadStatus.find((status: any) => 
      status.enabled && (
        status.relationships.progress.includes(id) ||
        status.relationships.disposition.includes(id) ||
        status.relationships.subDisposition.includes(id)
      )
    );
    return matchingStatus?.name || '';
  }

  /**
   * Convert name-based inputs to IDs and names using configuration
   */
  private async convertNamesToIds(data: Partial<ILead>, config: any) {
    const newData = { ...data };
    const relationships = {
      progress: undefined as { id: string; name: string } | undefined,
      disposition: undefined as { id: string; name: string } | undefined,
      subDisposition: undefined as { id: string; name: string } | undefined
    };

    // Convert lead progress
    if (data.leadProgress) {
      const progressConfig = config.leadProgress.find(
        (p: any) => p.name.toLowerCase() === data.leadProgress?.toLowerCase() && p.enabled
      );
      if (!progressConfig) {
        throw new Error(`Invalid lead progress: ${data.leadProgress}`);
      }
      newData.leadProgress = progressConfig.id;
      relationships.progress = {
        id: progressConfig.id,
        name: progressConfig.name
      };
    }

    // Convert lead disposition
    if (data.leadDisposition) {
      const dispositionConfig = config.leadDisposition.find(
        (d: any) => d.name.toLowerCase() === data.leadDisposition?.toLowerCase() && 
                    d.enabled &&
                    (newData.leadProgress ? d.progressId === newData.leadProgress : true)
      );
      if (!dispositionConfig) {
        throw new Error(`Invalid lead disposition: ${data.leadDisposition}`);
      }
      newData.leadDisposition = dispositionConfig.id;
      relationships.disposition = {
        id: dispositionConfig.id,
        name: dispositionConfig.name
      };
    }

    // Convert lead sub-disposition
    if (data.leadSubDisposition) {
      const subDispositionConfig = config.leadSubDisposition.find(
        (sd: any) => sd.name.toLowerCase() === data.leadSubDisposition?.toLowerCase() && 
                     sd.enabled &&
                     (newData.leadDisposition ? sd.dispositionId === newData.leadDisposition : true)
      );
      if (!subDispositionConfig) {
        throw new Error(`Invalid lead sub-disposition: ${data.leadSubDisposition}`);
      }
      newData.leadSubDisposition = subDispositionConfig.id;
      relationships.subDisposition = {
        id: subDispositionConfig.id,
        name: subDispositionConfig.name
      };
    }

    return { convertedData: newData, relationships };
  }

  /**
   * Create a new lead
   */
  public async createLead(data: Partial<ILead>) {
    // Validate against lead configuration
    const config = await LeadConfigurationModel.findOne({
      productId: new Types.ObjectId(data.productId?.toString()),
      isActive: true,
      isDeleted: false
    });

    if (!config) {
      throw new Error('Lead configuration not found for this product');
    }

    // Convert name-based inputs to IDs and get relationships
    const { convertedData, relationships } = await this.convertNamesToIds(data, config);

    const progressId = convertedData.leadProgress?.toString() || '';
    
    // Create current status object based on the relationships
    const currentLeadStatus = {
      id: progressId,
      name: this.findLeadStatusName(config, progressId),
      updatedAt: new Date(),
      relationships
    };
    console.log(currentLeadStatus);
    // Create the lead
    const lead = new LeadModel({
      ...convertedData,
      productId: new Types.ObjectId(convertedData.productId?.toString()),
      allocatedTo: new Types.ObjectId(convertedData.allocatedTo?.toString()),
      allocatedBy: new Types.ObjectId(convertedData.allocatedBy?.toString()),
      currentLeadStatus,
      leadStatusHistory: [currentLeadStatus]
    });

    return lead.save();
  }

  /**
   * Update an existing lead
   */
  public async updateLead(leadId: string, data: Partial<ILead>) {
    const lead = await LeadModel.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Get lead configuration
    const config = await LeadConfigurationModel.findOne({
      productId: lead.productId,
      isActive: true,
      isDeleted: false
    });

    if (!config) {
      throw new Error('Lead configuration not found for this product');
    }

    // Validate required fields for update
    const requiredFields = [
      'dateOfBirth',
      'gender',
      'addressLine1',
      'zipcode',
      'education',
      'professionType',
      'incomeGroup',
      'vehicleType'
    ];

    const missingFields = requiredFields.filter(field => {
      // Check if the field is being updated or already exists
      return !data[field as keyof ILead] && !lead[field as keyof ILead];
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for update: ${missingFields.join(', ')}`);
    }

    // Convert name-based inputs to IDs and get relationships
    const { convertedData, relationships } = await this.convertNamesToIds(data, config);

    // Merge with existing relationships
    const mergedRelationships = {
      progress: relationships.progress || lead.currentLeadStatus.relationships.progress,
      disposition: relationships.disposition || lead.currentLeadStatus.relationships.disposition,
      subDisposition: relationships.subDisposition || lead.currentLeadStatus.relationships.subDisposition
    };

    // Create new status if relationships changed
    if (relationships.progress || relationships.disposition || relationships.subDisposition) {
      const progressId = (convertedData.leadProgress || lead.currentLeadStatus.id)?.toString() || '';
      
      const newStatus = {
        id: progressId,
        name: this.findLeadStatusName(config, progressId),
        updatedAt: new Date(),
        relationships: mergedRelationships
      };

      // Update the lead with new status
      return LeadModel.findByIdAndUpdate(
        leadId,
        {
          $set: {
            ...convertedData,
            currentLeadStatus: newStatus,
            updatedAt: new Date()
          },
          $push: { leadStatusHistory: newStatus }
        },
        { new: true, runValidators: true }
      );
    }

    // If no relationship changes, just update other fields
    return LeadModel.findByIdAndUpdate(
      leadId,
      {
        $set: {
          ...convertedData,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );
  }

  /**
   * Get a lead by ID
   */
  public async getLead(leadId: string) {
    return LeadModel.findOne({
      _id: new Types.ObjectId(leadId),
      isDeleted: false
    }).populate('allocatedTo', 'firstName lastName email');
  }

  async getLeads(params: {
    allocatedTo: string;
    page: number;
    limit: number;
    stage?: string;
    leadProgress?: string;
    leadType?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }): Promise<{
    leads: ILead[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      allocatedTo,
      page,
      limit,
      stage,
      leadProgress,
      leadType,
      startDate,
      endDate,
      searchTerm
    } = params;

    const query: any = {
      allocatedTo: new Types.ObjectId(allocatedTo),
      isDeleted: false
    };

    // Add filters if provided
    if (stage) query.stage = stage;
    if (leadProgress) query.leadProgress = leadProgress;
    if (leadType) query.leadType = leadType;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search filter
    if (searchTerm) {
      query.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { primaryNumber: { $regex: searchTerm, $options: 'i' } },
        { emailAddress: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      LeadModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('productId', 'name')
        .populate('allocatedTo', 'firstName lastName email'),
      LeadModel.countDocuments(query)
    ]);

    return {
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Soft delete a lead
   */
  public async deleteLead(leadId: string) {
    return LeadModel.findByIdAndUpdate(
      leadId,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { new: true }
    );
  }

  /**
   * Change the ownership of leads
   */
  public async changeOwnership(params: {
    leadIds: string[];
    newOwnerId: string;
    changedBy: string;
    remarks?: string;
  }) {
    const { leadIds, newOwnerId, changedBy, remarks } = params;

    // Validate IDs
    if (!Types.ObjectId.isValid(newOwnerId)) {
      throw new Error('Invalid new owner ID');
    }

    if (!Types.ObjectId.isValid(changedBy)) {
      throw new Error('Invalid changed by user ID');
    }

    const validLeadIds = leadIds.filter(id => Types.ObjectId.isValid(id));
    if (validLeadIds.length === 0) {
      throw new Error('No valid lead IDs provided');
    }

    // Find all leads to be updated
    const leads = await LeadModel.find({
      _id: { $in: validLeadIds.map(id => new Types.ObjectId(id)) },
      isDeleted: false
    });

    if (leads.length === 0) {
      throw new Error('No leads found for the provided IDs');
    }

    const session = await LeadModel.startSession();
    session.startTransaction();

    try {
      const updatePromises = leads.map(async (lead) => {
        // Create history record for ownership change
        const ownershipHistory = new LeadHistoryModel({
          leadId: lead._id,
          changeType: 'OWNERSHIP_CHANGE',
          changedBy: new Types.ObjectId(changedBy),
          changes: [{
            field: 'allocatedTo',
            oldValue: lead.allocatedTo,
            newValue: new Types.ObjectId(newOwnerId)
          }],
          remarks
        });

        // Create history record for allocation change
        const allocationHistory = new LeadHistoryModel({
          leadId: lead._id,
          changeType: 'ALLOCATION_CHANGE',
          changedBy: new Types.ObjectId(changedBy),
          changes: [
            {
              field: 'allocatedTo',
              oldValue: lead.allocatedTo,
              newValue: new Types.ObjectId(newOwnerId)
            },
            {
              field: 'allocatedBy',
              oldValue: lead.allocatedBy,
              newValue: new Types.ObjectId(changedBy)
            },
            {
              field: 'allocatedAt',
              oldValue: lead.allocatedAt,
              newValue: new Date()
            }
          ],
          remarks
        });

        // Update lead
        const updatedLead = await LeadModel.findByIdAndUpdate(
          lead._id,
          {
            $set: {
              allocatedTo: new Types.ObjectId(newOwnerId),
              allocatedBy: new Types.ObjectId(changedBy),
              allocatedAt: new Date(),
              updatedAt: new Date()
            }
          },
          { new: true, session }
        );

        await Promise.all([
          ownershipHistory.save({ session }),
          allocationHistory.save({ session })
        ]);

        return updatedLead;
      });

      const updatedLeads = await Promise.all(updatePromises);
      await session.commitTransaction();

      return {
        message: 'Ownership changed successfully',
        updatedLeads,
        totalUpdated: updatedLeads.length
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get lead counts by status
   */
  public async getLeadStatusCounts(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const userObjectId = new Types.ObjectId(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const baseQuery = {
      $or: [
        { allocatedTo: userObjectId },
        { createdBy: userObjectId }
      ],
      isDeleted: false
    };

    // Get all leads count
    const allLeadsCount = await LeadModel.countDocuments(baseQuery);

    // Get today's leads count
    const todayLeadsCount = await LeadModel.countDocuments({
      ...baseQuery,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get counts by current status with detailed information
    const statusCounts = await LeadModel.aggregate([
      {
        $match: baseQuery
      },
      {
        $group: {
          _id: '$currentLeadStatus.name',
          count: { $sum: 1 },
          leads: {
            $push: {
              id: '$_id',
              firstName: '$firstName',
              lastName: '$lastName',
              stage: '$stage',
              leadProgress: '$leadProgress',
              updatedAt: '$updatedAt'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          leads: {
            $slice: ['$leads', 5] // Return only first 5 leads per status for preview
          },
          lastUpdated: {
            $max: '$leads.updatedAt'
          }
        }
      },
      {
        $sort: {
          'lastUpdated': -1
        }
      }
    ]);

    // Format the response with default and dynamic statuses
    const response = {
      summary: {
        total: allLeadsCount,
        today: todayLeadsCount
      },
      defaultStatuses: {
        All: {
          count: allLeadsCount,
          description: 'Total leads allocated or created'
        },
        'For Today': {
          count: todayLeadsCount,
          description: 'Leads created or allocated today'
        }
      },
      dynamicStatuses: statusCounts.reduce((acc: any, status) => {
        if (status.status) {
          acc[status.status] = {
            count: status.count,
            recentLeads: status.leads,
            lastUpdated: status.lastUpdated
          };
        }
        return acc;
      }, {})
    };

    return response;
  }

  /**
   * Get leads by status and user ID
   */
  public async getLeadsByStatus(params: {
    status: string;
    userId: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { status, userId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const userObjectId = new Types.ObjectId(userId);
    let query: any = {
      $or: [
        { allocatedTo: userObjectId },
        { createdBy: userObjectId }
      ],
      isDeleted: false
    };

    // Handle special status cases
    switch (status.toLowerCase()) {
      case 'all':
        // No additional filters needed
        break;
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query.createdAt = {
          $gte: today,
          $lt: tomorrow
        };
        break;
      default:
        // For regular status values, match against currentLeadStatus.name
        query['currentLeadStatus.name'] = status;
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    const [leads, total] = await Promise.all([
      LeadModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('productId', 'name')
        .populate('allocatedTo', 'firstName lastName email')
        .populate('allocatedBy', 'firstName lastName email')
        .lean(),
      LeadModel.countDocuments(query)
    ]);

    // Enhance the response with additional metadata
    const enhancedLeads = leads.map(lead => ({
      ...lead,
      statusAge: {
        days: Math.floor((Date.now() - new Date(lead.currentLeadStatus.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
        lastUpdated: lead.currentLeadStatus.updatedAt
      }
    }));

    return {
      leads: enhancedLeads,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + leads.length < total
      },
      summary: {
        totalCount: total,
        status,
        averageAge: total > 0 ? 
          Math.floor(enhancedLeads.reduce((acc, lead) => acc + lead.statusAge.days, 0) / total) : 
          0
      }
    };
  }
}

export const leadService = new LeadService();
