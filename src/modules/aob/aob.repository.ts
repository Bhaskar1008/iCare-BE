import {
  AobDocumentMasterModel,
  type IAobDocumentMaster,
} from '@/models/aob-document-master.model';
import type { CreateAobDocumentMasterDto } from './dto/create-aob-document-master.dto';
import logger from '@/common/utils/logger';

export class AobRepository {
  async createDocumentMaster(
    data: CreateAobDocumentMasterDto,
  ): Promise<IAobDocumentMaster> {
    try {
      logger.debug('Creating AOB document master', {
        documentType: data.documentType,
      });
      const documentMaster = new AobDocumentMasterModel(data);
      return await documentMaster.save();
    } catch (error) {
      logger.error('Failed to create AOB document master:', { error, data });
      throw error;
    }
  }

  async createManyDocumentMasters(
    documents: CreateAobDocumentMasterDto[],
  ): Promise<IAobDocumentMaster[]> {
    try {
      logger.debug('Creating multiple AOB document masters', {
        count: documents.length,
      });
      return await AobDocumentMasterModel.insertMany(documents);
    } catch (error) {
      logger.error('Failed to create multiple AOB document masters:', {
        error,
        count: documents.length,
      });
      throw error;
    }
  }

  async findAllDocumentMasters(): Promise<IAobDocumentMaster[]> {
    try {
      logger.debug('Fetching all AOB document masters');
      return await AobDocumentMasterModel.find().sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Failed to fetch AOB document masters:', { error });
      throw error;
    }
  }

  async findDocumentMasterById(id: string): Promise<IAobDocumentMaster | null> {
    try {
      logger.debug('Fetching AOB document master by ID', { id });
      return await AobDocumentMasterModel.findById(id);
    } catch (error) {
      logger.error('Failed to fetch AOB document master by ID:', { error, id });
      throw error;
    }
  }

  async findDocumentMastersByCategory(
    category: string,
  ): Promise<IAobDocumentMaster[]> {
    try {
      logger.debug('Fetching AOB document masters by category', { category });
      return await AobDocumentMasterModel.find({ category }).sort({
        createdAt: -1,
      });
    } catch (error) {
      logger.error('Failed to fetch AOB document masters by category:', {
        error,
        category,
      });
      throw error;
    }
  }

  async deleteAllDocumentMasters(): Promise<number> {
    try {
      logger.debug('Deleting all AOB document masters');
      const result = await AobDocumentMasterModel.deleteMany({});
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Failed to delete all AOB document masters:', { error });
      throw error;
    }
  }

  async findDocumentMasterByType(
    documentType: string,
  ): Promise<IAobDocumentMaster | null> {
    try {
      logger.debug('Fetching AOB document master by type', { documentType });
      return await AobDocumentMasterModel.findOne({ documentType });
    } catch (error) {
      logger.error('Failed to fetch AOB document master by type:', {
        error,
        documentType,
      });
      throw error;
    }
  }
}
