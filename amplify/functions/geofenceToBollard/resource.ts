import { defineFunction } from '@aws-amplify/backend';

export const geofenceToBollard = defineFunction({
  name: 'geofenceToBollard',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  environment: {
    // Will be set after Space table is created
    SPACE_TABLE_NAME: '',
  },
});
