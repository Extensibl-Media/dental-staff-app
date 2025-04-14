import { PutObjectCommand, type PutObjectCommandInput } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from './config';

export type FileType = {
	mimetype: string;
	fileName: string;
	buffer: Buffer;
};

export const uploadFile = async ({ file, location }: { file: FileType; location?: string }) => {
	const key = `${location ? `${location}/` : ''}${file.fileName}`;
	const uploadParams: PutObjectCommandInput = {
		Bucket: BUCKET_NAME,
		Key: key,
		Body: file.buffer,
		ContentType: file.mimetype,
		ACL: 'public-read'
	};

	try {
		const data = await s3Client.send(new PutObjectCommand(uploadParams));
		console.log('Success', data);
		return `https://dentalstaffusdocs.nyc3.cdn.digitaloceanspaces.com/${key}`;
	} catch (err) {
		console.log('Error', err);
		throw err;
	}
};
