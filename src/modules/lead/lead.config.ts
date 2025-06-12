import { v4 as uuidv4 } from 'uuid';

// Sample dropdown values
export const LEAD_PROGRESS_OPTIONS = [
  'New Lead Entry',
  'Initial Contact',
  'Follow Up',
  'Meeting Scheduled',
  'Meeting Completed',
  'Negotiation',
  'Documentation',
] as const;

export const LEAD_DISPOSITION_OPTIONS = [
  'Interested',
  'Not Interested',
  'Need More Info',
  'Cannot Afford',
  'Wrong Number',
  'Already Purchased',
  'Technical Issue',
] as const;

export const LEAD_SUB_DISPOSITION_OPTIONS = {
  Interested: [
    'Ready to Buy',
    'Comparing Options',
    'Needs Time',
    'Waiting for Documents',
  ],
  'Not Interested': [
    'Budget Constraints',
    'Not Right Time',
    'Found Alternative',
    'No Requirement',
  ],
  'Need More Info': [
    'Product Details',
    'Pricing Information',
    'Documentation Required',
    'Technical Specifications',
  ],
  'Cannot Afford': [
    'High Price',
    'No Financing',
    'Income Issues',
    'Other Priorities',
  ],
  'Wrong Number': ['Invalid Contact', 'Changed Number', 'Not Reachable'],
  'Already Purchased': [
    'From Competitor',
    'Different Product',
    'Recent Purchase',
  ],
  'Technical Issue': ['Call Dropped', 'System Error', 'Network Issue'],
} as const;

export type LeadProgress = (typeof LEAD_PROGRESS_OPTIONS)[number];
export type LeadDisposition = (typeof LEAD_DISPOSITION_OPTIONS)[number];
export type LeadSubDisposition =
  (typeof LEAD_SUB_DISPOSITION_OPTIONS)[keyof typeof LEAD_SUB_DISPOSITION_OPTIONS][number];

interface LeadStatus {
  id: string;
  name: 'Open' | 'Discarded' | 'Converted' | 'Failed';
  updatedAt: Date;
  progress: string;
  disposition?: string;
  subDisposition?: string;
}

export function determineLeadStatus(
  progress: LeadProgress,
  disposition?: LeadDisposition,
  subDisposition?: LeadSubDisposition,
): LeadStatus {
  const status: LeadStatus = {
    id: uuidv4(),
    name: 'Open', // Default status
    updatedAt: new Date(),
    progress,
    disposition,
    subDisposition,
  };

  // Set status to Open for new leads
  if (progress === 'New Lead Entry') {
    status.name = 'Open';
    return status;
  }

  // Determine status based on combinations
  if (disposition === 'Not Interested' || disposition === 'Wrong Number') {
    status.name = 'Discarded';
  } else if (
    disposition === 'Cannot Afford' ||
    disposition === 'Technical Issue'
  ) {
    status.name = 'Failed';
  } else if (
    disposition === 'Interested' &&
    subDisposition === 'Ready to Buy' &&
    progress === 'Documentation'
  ) {
    status.name = 'Converted';
  }

  return status;
}
