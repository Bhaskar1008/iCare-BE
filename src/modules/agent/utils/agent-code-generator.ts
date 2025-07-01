import { AgentModel } from '@/models/agent.model';
import { ProjectModel } from '@/models/project.model';
import logger from '@/common/utils/logger';

/**
 * Generates a unique agent code based on project name
 * Format: [Project Prefix][Sequence Number]
 * Example: IC00001, IC00002, etc.
 */
export async function generateAgentCode(projectId: string): Promise<string> {
  try {
    logger.debug('Generating agent code for project', { projectId });

    // Get project details to extract prefix
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Extract prefix from project name (first 2 characters)
    // If project name is single word, use first 2 chars
    // If multiple words, use first char of first two words
    let prefix = '';
    const projectName = project.projectName.trim();
    const words = projectName.split(/\s+/);

    if (words.length === 1) {
      // Single word project name - use first 2 chars
      prefix = projectName.substring(0, 2).toUpperCase();
    } else {
      // Multiple words - use first char of first two words
      prefix = (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }

    // Find the highest sequence number for this prefix
    const latestAgent = await AgentModel.findOne({
      agentCode: new RegExp(`^${prefix}\\d+$`),
      isDeleted: false,
    }).sort({ agentCode: -1 });

    let sequenceNumber = 1;

    if (latestAgent) {
      const match = latestAgent.agentCode.match(/^[A-Z]+(\d+)$/);
      sequenceNumber = parseInt(match?.[1] ?? '0', 10) + 1;
    }

    // Format the agent code: prefix + padded sequence number
    const agentCode = `${prefix}${sequenceNumber.toString().padStart(5, '0')}`;

    logger.debug('Generated agent code', {
      projectId,
      projectName,
      prefix,
      sequenceNumber,
      agentCode,
    });

    return agentCode;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to generate agent code:', {
      error: err.message,
      stack: err.stack,
      projectId,
    });
    throw err;
  }
}

/**
 * Validates if an agent code already exists
 * @returns true if the code is unique, false if it already exists
 */
export async function isAgentCodeUnique(agentCode: string): Promise<boolean> {
  try {
    const existingAgent = await AgentModel.findOne({
      agentCode,
      isDeleted: false,
    });

    return !existingAgent;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to check agent code uniqueness:', {
      error: err.message,
      stack: err.stack,
      agentCode,
    });
    throw err;
  }
}
