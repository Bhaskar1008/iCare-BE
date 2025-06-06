import { Types } from 'mongoose';
import { LeadConfigurationModel } from '@/models/lead-configuration.model';
import type { 
  ILeadProgress, 
  ILeadDisposition, 
  ILeadSubDisposition, 
  ICondition,
  ILeadConfiguration
} from '@/models/lead-configuration.model';

interface IFieldConditions {
  visible: boolean;
  required: boolean;
}

interface IFieldConditionsResponse {
  appointmentDate: IFieldConditions;
  startTime: IFieldConditions;
  leadSubDisposition: IFieldConditions;
  leadStatus: IFieldConditions;
}

class LeadConfigService {
  /**
   * Create a new lead configuration
   */
  public async createLeadConfiguration(data: Partial<ILeadConfiguration>) {
    const productId = data.productId ? 
      (typeof data.productId === 'string' ? new Types.ObjectId(data.productId) : data.productId) 
      : undefined;

    const config = new LeadConfigurationModel({
      ...data,
      productId,
      isActive: true
    });
    return config.save();
  }

  /**
   * Update an existing lead configuration
   */
  public async updateLeadConfiguration(productId: string, data: Partial<ILeadConfiguration>) {
    return LeadConfigurationModel.findOneAndUpdate(
      {
        productId: new Types.ObjectId(productId),
        isActive: true,
        isDeleted: false
      },
      {
        $set: {
          ...data,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
  }

  /**
   * Get lead configuration for a specific product
   */
  public async getLeadConfiguration(productId: string) {
    return LeadConfigurationModel.findOne({
      productId: new Types.ObjectId(productId),
      isActive: true,
      isDeleted: false
    });
  }

  /**
   * Get dispositions for a specific progress ID
   */
  public async getDispositions(productId: string, progressId: string) {
    const config = await this.getLeadConfiguration(productId);
    if (!config) return null;

    return config.leadDisposition
      .filter((d: ILeadDisposition) => d.enabled && d.progressId === progressId)
      .map((d: ILeadDisposition) => ({
        id: d.id,
        name: d.name
      }));
  }

  /**
   * Get sub-dispositions for a specific disposition ID
   */
  public async getSubDispositions(productId: string, dispositionId: string) {
    const config = await this.getLeadConfiguration(productId);
    if (!config) return null;

    return config.leadSubDisposition
      .filter((sd: ILeadSubDisposition) => sd.enabled && sd.dispositionId === dispositionId)
      .map((sd: ILeadSubDisposition) => ({
        id: sd.id,
        name: sd.name
      }));
  }

  /**
   * Get field conditions for the current context
   */
  public async getFieldConditions(
    productId: string,
    progressId?: string,
    dispositionId?: string,
    subDispositionId?: string
  ): Promise<IFieldConditionsResponse | null> {
    const config = await this.getLeadConfiguration(productId);
    if (!config) return null;

    const context: Record<string, string> = {};
    if (progressId) context.leadProgress = progressId;
    if (dispositionId) context.leadDisposition = dispositionId;
    if (subDispositionId) context.leadSubDisposition = subDispositionId;

    const relevantConditions = config.conditions || [];

    const checkFieldConditions = (field: string) => {
      const showConditions = relevantConditions.filter((c: ICondition) => 
        c.field === field && c.action === 'show' && context[c.whenField] === c.whenValue
      );
      const requireConditions = relevantConditions.filter((c: ICondition) => 
        c.field === field && c.action === 'require' && context[c.whenField] === c.whenValue
      );
      return {
        visible: showConditions.length > 0,
        required: requireConditions.length > 0
      };
    };

    return {
      appointmentDate: checkFieldConditions('appointmentDate'),
      startTime: checkFieldConditions('startTime'),
      leadSubDisposition: checkFieldConditions('leadSubDisposition'),
      leadStatus: checkFieldConditions('leadStatus')
    };
  }
}

export const leadConfigService = new LeadConfigService(); 