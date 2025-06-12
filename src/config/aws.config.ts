import { config } from 'dotenv';

config();

export const awsConfig = {
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  s3: {
    bucket:
      process.env.AWS_S3_BUCKET ?? 'salesverse-inxt-public-documents-20250531',
    baseUrl:
      process.env.AWS_S3_BASEURL ??
      'https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/Salesverse/',
    expiresIn: process.env.AWS_EXPIRES_IN ?? 3600, // 1 hour in seconds
  },
};
