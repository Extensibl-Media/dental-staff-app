export interface EmailConfig {
	from: {
		email: string;
		name?: string;
	};
	replyTo?: {
		email: string;
		name?: string;
	};
}

export interface EmailRecipient {
	email: string;
	name?: string;
}

export interface EmailSendResult {
	id: string;
	success: boolean;
	error?: string;
}

export interface BulkEmailSendResult {
	results: EmailSendResult[];
	totalSent: number;
	totalFailed: number;
	errors: string[];
}

export interface SendEmailParams {
	to: EmailRecipient[];
	subject: string;
	html: string;
	text?: string;
	replyTo?: {
		email: string;
		name?: string;
	};
}

export interface SendBulkEmailParams {
	emails: Array<{
		to: EmailRecipient[];
		subject: string;
		html: string;
		text?: string;
		replyTo?: {
			email: string;
			name?: string;
		};
	}>;
}
