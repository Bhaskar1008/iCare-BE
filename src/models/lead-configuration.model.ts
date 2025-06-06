import { Schema, model, Types } from 'mongoose';
import type { IBaseModel } from './base.model';

// Base interface for common properties
interface IConfigItem {
  id: string;
  name: string;
  enabled: boolean;
}

// Interfaces for each configuration type
export interface ILeadProgress extends IConfigItem {}

export interface ILeadDisposition extends IConfigItem {
  progressId: string;
}

export interface ILeadSubDisposition extends IConfigItem {
  dispositionId: string;
}

interface IStatusRelationships {
  progress: string[];
  disposition: string[];
  subDisposition: string[];
}

export interface ILeadStatus extends IConfigItem {
  relationships: IStatusRelationships;
}

export interface ICondition {
  id: string;
  field: string;
  whenField: string;
  whenValue: string;
  action: 'show' | 'hide' | 'require';
}

export interface ILeadConfiguration extends IBaseModel {
  productId: Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  leadProgress: ILeadProgress[];
  leadDisposition: ILeadDisposition[];
  leadSubDisposition: ILeadSubDisposition[];
  leadStatus: ILeadStatus[];
  conditions: ICondition[];
}

// Schema for each configuration type
const configItemSchema = {
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true
  }
};

const leadProgressSchema = new Schema({
  ...configItemSchema
}, { _id: false });

const leadDispositionSchema = new Schema({
  ...configItemSchema,
  progressId: {
    type: String,
    required: true
  }
}, { _id: false });

const leadSubDispositionSchema = new Schema({
  ...configItemSchema,
  dispositionId: {
    type: String,
    required: true
  }
}, { _id: false });

const statusRelationshipsSchema = new Schema({
  progress: {
    type: [String],
    default: []
  },
  disposition: {
    type: [String],
    default: []
  },
  subDisposition: {
    type: [String],
    default: []
  }
}, { _id: false });

const leadStatusSchema = new Schema({
  ...configItemSchema,
  relationships: {
    type: statusRelationshipsSchema,
    required: true,
    default: {
      progress: [],
      disposition: [],
      subDisposition: []
    }
  }
}, { _id: false });

const conditionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  field: {
    type: String,
    required: true,
    enum: ['appointmentDate', 'startTime', 'leadSubDisposition', 'leadStatus']
  },
  whenField: {
    type: String,
    required: true,
    enum: ['leadProgress', 'leadDisposition', 'leadSubDisposition', 'leadStatus']
  },
  whenValue: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['show', 'hide', 'require']
  }
}, { _id: false });

const leadConfigurationSchema = new Schema<ILeadConfiguration>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    name: {
      type: String,
      required: [true, 'Configuration name is required'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    leadProgress: {
      type: [leadProgressSchema],
      required: true,
      validate: {
        validator: function(arr: ILeadProgress[]) {
          // Ensure unique IDs
          const ids = new Set(arr.map(item => item.id));
          return ids.size === arr.length;
        },
        message: 'Duplicate lead progress IDs are not allowed'
      }
    },
    leadDisposition: {
      type: [leadDispositionSchema],
      required: true,
      validate: {
        validator: function(arr: ILeadDisposition[]) {
          // Ensure unique IDs
          const ids = new Set(arr.map(item => item.id));
          if (ids.size !== arr.length) return false;

          // Ensure valid progressId references
          const progressIds = new Set(this.leadProgress.map((p: ILeadProgress) => p.id));
          return arr.every(item => progressIds.has(item.progressId));
        },
        message: 'Invalid lead disposition configuration'
      }
    },
    leadSubDisposition: {
      type: [leadSubDispositionSchema],
      required: true,
      validate: {
        validator: function(arr: ILeadSubDisposition[]) {
          // Ensure unique IDs
          const ids = new Set(arr.map(item => item.id));
          if (ids.size !== arr.length) return false;

          // Ensure valid dispositionId references
          const dispositionIds = new Set(this.leadDisposition.map((d: ILeadDisposition) => d.id));
          return arr.every(item => dispositionIds.has(item.dispositionId));
        },
        message: 'Invalid lead sub-disposition configuration'
      }
    },
    leadStatus: {
      type: [leadStatusSchema],
      required: true,
      validate: {
        validator: function(arr: ILeadStatus[]) {
          // Ensure unique IDs
          const ids = new Set(arr.map(item => item.id));
          if (ids.size !== arr.length) return false;

          // Get all valid IDs
          const progressIds = new Set(this.leadProgress.map((p: ILeadProgress) => p.id));
          const dispositionIds = new Set(this.leadDisposition.map((d: ILeadDisposition) => d.id));
          const subDispositionIds = new Set(this.leadSubDisposition.map((sd: ILeadSubDisposition) => sd.id));

          // Validate relationships
          return arr.every(status => {
            // Validate progress relationships
            const validProgress = status.relationships.progress.every(id => progressIds.has(id));
            if (!validProgress) return false;

            // Validate disposition relationships
            const validDisposition = status.relationships.disposition.every(id => dispositionIds.has(id));
            if (!validDisposition) return false;

            // Validate sub-disposition relationships
            const validSubDisposition = status.relationships.subDisposition.every(id => subDispositionIds.has(id));
            if (!validSubDisposition) return false;

            return true;
          });
        },
        message: 'Invalid lead status configuration or relationships'
      }
    },
    conditions: {
      type: [conditionSchema],
      required: false,
      validate: {
        validator: function(arr: ICondition[]) {
          // Ensure unique IDs
          const ids = new Set(arr.map(item => item.id));
          if (ids.size !== arr.length) return false;

          // Validate referenced IDs in conditions
          return arr.every(condition => {
            switch (condition.whenField) {
              case 'leadProgress':
                return this.leadProgress.some((p: ILeadProgress) => p.id === condition.whenValue);
              case 'leadDisposition':
                return this.leadDisposition.some((d: ILeadDisposition) => d.id === condition.whenValue);
              case 'leadSubDisposition':
                return this.leadSubDisposition.some((s: ILeadSubDisposition) => s.id === condition.whenValue);
              case 'leadStatus':
                return this.leadStatus.some((s: ILeadStatus) => s.id === condition.whenValue);
              default:
                return false;
            }
          });
        },
        message: 'Invalid condition configuration'
      }
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'leadConfigurations'
  }
);

// Indexes
leadConfigurationSchema.index({ productId: 1 });
leadConfigurationSchema.index({ isActive: 1 });
leadConfigurationSchema.index({ isDeleted: 1 });
leadConfigurationSchema.index({ createdAt: -1 });

// Helper methods
leadConfigurationSchema.methods = {
  isFieldVisible: function(field: string, context: Record<string, string>): boolean {
    const showConditions = this.conditions.filter((c: ICondition) => 
      c.field === field && c.action === 'show' && context[c.whenField] === c.whenValue
    );
    return showConditions.length > 0;
  },

  isFieldRequired: function(field: string, context: Record<string, string>): boolean {
    const requireConditions = this.conditions.filter((c: ICondition) => 
      c.field === field && c.action === 'require' && context[c.whenField] === c.whenValue
    );
    return requireConditions.length > 0;
  },

  getValidSubDispositions: function(dispositionId: string): ILeadSubDisposition[] {
    return this.leadSubDisposition.filter((sd: ILeadSubDisposition) => 
      sd.dispositionId === dispositionId && sd.enabled
    );
  },

  getValidDispositions: function(progressId: string): ILeadDisposition[] {
    return this.leadDisposition.filter((d: ILeadDisposition) => 
      d.progressId === progressId && d.enabled
    );
  },

  // New helper methods for status relationships
  isValidStatusTransition: function(
    status: string,
    progress?: string,
    disposition?: string,
    subDisposition?: string
  ): boolean {
    const statusConfig = this.leadStatus.find((s: ILeadStatus) => s.id === status && s.enabled);
    if (!statusConfig) return false;

    // Check progress relationship
    if (progress && !statusConfig.relationships.progress.includes(progress)) {
      return false;
    }

    // Check disposition relationship
    if (disposition && !statusConfig.relationships.disposition.includes(disposition)) {
      return false;
    }

    // Check sub-disposition relationship
    if (subDisposition && !statusConfig.relationships.subDisposition.includes(subDisposition)) {
      return false;
    }

    return true;
  },

  getValidStatusesForContext: function(
    progress?: string,
    disposition?: string,
    subDisposition?: string
  ): ILeadStatus[] {
    return this.leadStatus.filter((status: ILeadStatus) => 
      status.enabled &&
      (!progress || status.relationships.progress.includes(progress)) &&
      (!disposition || status.relationships.disposition.includes(disposition)) &&
      (!subDisposition || status.relationships.subDisposition.includes(subDisposition))
    );
  }
};

export const LeadConfigurationModel = model<ILeadConfiguration>('LeadConfiguration', leadConfigurationSchema); 