import type {
  Document,
  Model,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
} from 'mongoose';
import {
  DatabaseOperationException,
  DatabaseValidationException,
} from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';
import { Types } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;
  protected modelName: string;

  constructor(model: Model<T>) {
    this.model = model;
    this.modelName = model.modelName;
  }

  public async create(data: Partial<T>): Promise<T> {
    try {
      logger.debug(`Creating new ${this.modelName}`, { data });
      const document = new this.model(data);
      const result = await document.save();
      logger.info(`${this.modelName} created successfully`, { id: result._id });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to create ${this.modelName}:`, {
        error: err.message,
        stack: err.stack,
        data,
      });

      if (err.name === 'ValidationError') {
        throw new DatabaseValidationException(
          `Validation failed for ${this.modelName}: ${err.message}`,
        );
      }

      throw new DatabaseOperationException(
        `Failed to create ${this.modelName}: ${err.message}`,
      );
    }
  }

  public async findById(id: string): Promise<T | null> {
    try {
      logger.debug(`Finding ${this.modelName} by ID`, { id });

      if (!Types.ObjectId.isValid(id)) {
        logger.error(`Invalid ObjectId format for ${this.modelName}`, { id });
        throw new DatabaseOperationException(
          `Invalid ID format for ${this.modelName}`,
        );
      }

      const result = await this.model.findById(new Types.ObjectId(id)).exec();
      logger.debug(`${this.modelName} found by ID`, { id, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to find ${this.modelName} by ID:`, {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw new DatabaseOperationException(
        `Failed to find ${this.modelName}: ${err.message}`,
      );
    }
  }

  public async findOne(
    filter: FilterQuery<T>,
    select?: string | null,
  ): Promise<T | null> {
    try {
      logger.debug(`Finding ${this.modelName} with filter`, { filter, select });
      const query = this.model.findOne(filter);
      if (select) {
        query.select(select);
      }
      const result = await query.exec();
      logger.debug(`${this.modelName} found with filter`, {
        filter,
        found: !!result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to find ${this.modelName}:`, {
        error: err.message,
        stack: err.stack,
        filter,
      });
      throw new DatabaseOperationException(
        `Failed to find ${this.modelName}: ${err.message}`,
      );
    }
  }

  public async find(
    filter: FilterQuery<T> = {},
    options?: QueryOptions,
  ): Promise<T[]> {
    try {
      logger.debug(`Finding ${this.modelName} documents`, { filter, options });
      const result = await this.model.find(filter, null, options).exec();
      logger.debug(`${this.modelName} documents found`, {
        filter,
        options,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to find ${this.modelName} documents:`, {
        error: err.message,
        stack: err.stack,
        filter,
        options,
      });
      throw new DatabaseOperationException(
        `Failed to find ${this.modelName} documents: ${err.message}`,
      );
    }
  }

  public async updateById(
    id: string,
    update: UpdateQuery<T>,
  ): Promise<T | null> {
    try {
      logger.debug(`Updating ${this.modelName} by ID`, { id, update });
      const result = await this.model
        .findByIdAndUpdate(id, update, {
          new: true,
          runValidators: true,
        })
        .exec();
      logger.info(`${this.modelName} updated successfully`, {
        id,
        updated: !!result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to update ${this.modelName}:`, {
        error: err.message,
        stack: err.stack,
        id,
        update,
      });

      if (err.name === 'ValidationError') {
        throw new DatabaseValidationException(
          `Validation failed for ${this.modelName}: ${err.message}`,
        );
      }

      throw new DatabaseOperationException(
        `Failed to update ${this.modelName}: ${err.message}`,
      );
    }
  }

  public async deleteById(id: string): Promise<T | null> {
    try {
      logger.debug(`Deleting ${this.modelName} by ID`, { id });
      const result = await this.model.findByIdAndDelete(id).exec();
      logger.info(`${this.modelName} deleted successfully`, {
        id,
        deleted: !!result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to delete ${this.modelName}:`, {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw new DatabaseOperationException(
        `Failed to delete ${this.modelName}: ${err.message}`,
      );
    }
  }

  public async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      logger.debug(`Counting ${this.modelName} documents`, { filter });
      const result = await this.model.countDocuments(filter).exec();
      logger.debug(`${this.modelName} documents counted`, {
        filter,
        count: result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to count ${this.modelName} documents:`, {
        error: err.message,
        stack: err.stack,
        filter,
      });
      throw new DatabaseOperationException(
        `Failed to count ${this.modelName} documents: ${err.message}`,
      );
    }
  }

  public async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      logger.debug(`Checking if ${this.modelName} exists`, { filter });
      const result = await this.model.exists(filter).exec();
      logger.debug(`${this.modelName} exists check result`, {
        filter,
        exists: !!result,
      });
      return !!result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to check if ${this.modelName} exists:`, {
        error: err.message,
        stack: err.stack,
        filter,
      });
      throw new DatabaseOperationException(
        `Failed to check if ${this.modelName} exists: ${err.message}`,
      );
    }
  }
}
