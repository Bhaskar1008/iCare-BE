import { logger } from '../utils/logger.js';

class SearchService {
  constructor() {
    this.indexes = new Map();
  }

  async createIndex(indexName, documents, options = {}) {
    try {
      const index = new Map();
      
      for (const doc of documents) {
        const searchableText = this.getSearchableText(doc, options.fields);
        const tokens = this.tokenize(searchableText);
        
        for (const token of tokens) {
          if (!index.has(token)) {
            index.set(token, new Set());
          }
          index.get(token).add(doc.id);
        }
      }

      this.indexes.set(indexName, {
        index,
        documents: new Map(documents.map(doc => [doc.id, doc])),
        options,
      });

      logger.info({
        indexName,
        documentsCount: documents.length,
      }, 'Search index created');
    } catch (error) {
      logger.error({
        error,
        indexName,
      }, 'Failed to create search index');
      throw error;
    }
  }

  async search(indexName, query, { limit = 10, offset = 0 } = {}) {
    try {
      const indexData = this.indexes.get(indexName);
      if (!indexData) {
        throw new Error(`Index ${indexName} not found`);
      }

      const tokens = this.tokenize(query);
      const results = new Map();

      for (const token of tokens) {
        const documentIds = indexData.index.get(token) || new Set();
        
        for (const docId of documentIds) {
          results.set(docId, (results.get(docId) || 0) + 1);
        }
      }

      // Sort by relevance score
      const sortedResults = Array.from(results.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(offset, offset + limit)
        .map(([docId, score]) => ({
          ...indexData.documents.get(docId),
          score,
        }));

      logger.info({
        indexName,
        query,
        resultsCount: sortedResults.length,
      }, 'Search completed');

      return sortedResults;
    } catch (error) {
      logger.error({
        error,
        indexName,
        query,
      }, 'Search operation failed');
      throw error;
    }
  }

  private tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  private getSearchableText(doc, fields) {
    return fields
      .map(field => doc[field])
      .filter(Boolean)
      .join(' ');
  }

  async deleteIndex(indexName) {
    try {
      const deleted = this.indexes.delete(indexName);
      
      if (deleted) {
        logger.info({
          indexName,
        }, 'Search index deleted');
      }
      
      return deleted;
    } catch (error) {
      logger.error({
        error,
        indexName,
      }, 'Failed to delete search index');
      throw error;
    }
  }
}

export const searchService = new SearchService();