import type { CreateModuleConfigDto } from '../dto/create-module-config.dto';

export const activityTrackerConfig: CreateModuleConfigDto = {
  moduleId: '', // This should be set dynamically when used
  projectId: undefined, // This can be set dynamically when used
  configName: 'activityTrackerConfig',
  description: 'Configuration for Activity Tracker module',
  fields: [
    {
      fieldName: 'eventWith',
      fieldType: 'dropdown',
      description: 'Event With options for Activity Tracker',
      values: [
        {
          key: 'meeting',
          value: 'Meeting',
          displayName: 'Meeting',
          dependentValues: ['internal', 'external', 'client'],
        },
        {
          key: 'call',
          value: 'Call',
          displayName: 'Call',
          dependentValues: ['prospect', 'client', 'partner'],
        },
        {
          key: 'email',
          value: 'Email',
          displayName: 'Email',
          dependentValues: ['prospect', 'client', 'internal'],
        },
        {
          key: 'visit',
          value: 'Visit',
          displayName: 'Visit',
          dependentValues: ['client', 'prospect'],
        },
      ],
    },
    {
      fieldName: 'meetingType',
      fieldType: 'dropdown',
      description: 'Meeting type options for Activity Tracker',
      values: [
        {
          key: 'internal',
          value: 'Internal',
          displayName: 'Internal Meeting',
        },
        {
          key: 'external',
          value: 'External',
          displayName: 'External Meeting',
        },
        {
          key: 'client',
          value: 'Client',
          displayName: 'Client Meeting',
        },
      ],
    },
    {
      fieldName: 'callType',
      fieldType: 'dropdown',
      description: 'Call type options for Activity Tracker',
      values: [
        {
          key: 'prospect',
          value: 'Prospect',
          displayName: 'Prospect Call',
        },
        {
          key: 'client',
          value: 'Client',
          displayName: 'Client Call',
        },
        {
          key: 'partner',
          value: 'Partner',
          displayName: 'Partner Call',
        },
      ],
    },
    {
      fieldName: 'emailType',
      fieldType: 'dropdown',
      description: 'Email type options for Activity Tracker',
      values: [
        {
          key: 'prospect',
          value: 'Prospect',
          displayName: 'Prospect Email',
        },
        {
          key: 'client',
          value: 'Client',
          displayName: 'Client Email',
        },
        {
          key: 'internal',
          value: 'Internal',
          displayName: 'Internal Email',
        },
      ],
    },
    {
      fieldName: 'visitType',
      fieldType: 'dropdown',
      description: 'Visit type options for Activity Tracker',
      values: [
        {
          key: 'client',
          value: 'Client',
          displayName: 'Client Visit',
        },
        {
          key: 'prospect',
          value: 'Prospect',
          displayName: 'Prospect Visit',
        },
      ],
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
  },
};
