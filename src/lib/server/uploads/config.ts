import { S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

export const BUCKET_NAME = env.AWS_BUCKET_NAME;

export const s3Client = new S3Client({
	region: env.AWS_REGION,
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY
	},
	endpoint: 'https://nyc3.digitaloceanspaces.com',
	forcePathStyle: false,
	logger: console
});
