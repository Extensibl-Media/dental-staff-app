import { uploadFile } from '$lib/server/uploads';
import type { FileType } from '$lib/server/uploads';
import { fail, json, type RequestEvent } from '@sveltejs/kit';

export const POST = async ({ request }: RequestEvent) => {
	const contentType = request.headers.get('Content-Type');
	if (!contentType || !contentType.startsWith('multipart/form-data')) {
		return fail(400, { success: false, message: 'Invalid content type' });
	}

	try {
		// Parse the multipart form data
		const formData = await request.formData();
		const location = formData.get('location') as string;
		const uploadedFile = formData.get('file');

		if (!uploadedFile || !(uploadedFile instanceof File)) {
			return fail(400, { success: false, message: 'No file provided' });
		}

		// Convert the file to an ArrayBuffer
		const buffer = await uploadedFile.arrayBuffer();

		const fileToUpload: FileType = {
			fileName: uploadedFile.name,
			mimetype: uploadedFile.type,
			buffer: Buffer.from(buffer)
		};

		// Upload to S3
		const url = await uploadFile({ file: fileToUpload, location });

		return json({ success: true, url, fileName: uploadedFile.name });
	} catch (error) {
		console.error('Error uploading file:', error);
		return fail(500, { success: false, message: 'File upload failed' });
	}
};
