import { ExternalNotificationService } from './externalNotificationService';
import db from '$lib/server/database/drizzle';
import type { externalNotificationTypeEnum } from '$lib/server/database/schemas/notification';
import type { userTable } from '../database/schemas/auth';
import type { candidateProfileTable } from '../database/schemas/candidate';
import type {
	clientProfileTable,
	clientStaffProfileTable,
	companyOfficeLocationTable,
	clientCompanyTable
} from '../database/schemas/client';
import type {
	requisitionTable,
	requisitionApplicationTable
} from '../database/schemas/requisition';

export const externalNotificationService = new ExternalNotificationService(
	db,
	process.env.BREVO_API_KEY!,
	{
		from: {
			email: 'notifications@dentalstaff.us',
			name: 'DentalStaff.US'
		},
		replyTo: {
			email: 'support@dentalstaff.us',
			name: 'Support Team'
		}
	},
	process.env.BREVO_SMS_API_KEY!,
	{
		from: 'DentalStaff.US' // SMS sender name
	}
);

export type {
	ExternalNotificationTemplateSelect,
	NewExternalNotificationTemplate
} from '$lib/server/database/schemas/notification';

export { externalNotificationTemplatesTable } from '$lib/server/database/schemas/notification';

export class NotificationError extends Error {
	constructor(
		message: string,
		public code: string
	) {
		super(message);
		this.name = 'NotificationError';
	}
}

export class TemplateNotFoundError extends NotificationError {
	constructor(templateId: string) {
		super(`Template not found: ${templateId}`, 'TEMPLATE_NOT_FOUND');
	}
}

export class ValidationError extends NotificationError {
	constructor(message: string) {
		super(message, 'VALIDATION_ERROR');
	}
}

export class ChannelError extends NotificationError {
	constructor(channel: string, message: string) {
		super(`${channel} error: ${message}`, 'CHANNEL_ERROR');
	}
}

// TableTypes defines the structure of your database schema
export type TableTypes = {
	// Your actual tables from your schema
	requisitions: typeof requisitionTable;
	requisition_applications: typeof requisitionApplicationTable;
	candidate_profiles: typeof candidateProfileTable;
	client_profiles: typeof clientProfileTable;
	user: typeof userTable;
	client_staff: typeof clientStaffProfileTable;
	company_location: typeof companyOfficeLocationTable;
	client_company: typeof clientCompanyTable;

	// Add any other tables you want to reference in notifications
};

export type EmailConfig = {
	from: {
		email: string;
		name?: string;
	};
	replyTo?: {
		email: string;
		name?: string;
	};
};

export type ExternalNotificationType = (typeof externalNotificationTypeEnum.enumValues)[number];

export type SmsConfig = {
	from: string;
};

export type CreateExternalTemplateParams = {
	name: string;
	description?: string;
	type: ExternalNotificationType;
	template: string;
	inAppPreview: string;
	requiredSources: Record<string, string[]>;
	createdBy: string;
};

export type SendExternalNotificationParams = {
	templateId: string;
	userId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: Record<string, any>;
	channels?: {
		email?: {
			to: string;
			name?: string;
		};
		sms?: {
			to: string;
		};
	};
};

export type SendBatchExternalNotificationParams = {
	templateId: string;
	userIds: string[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: Record<string, any>;
	channels?: {
		email?: Array<{
			userId: string;
			email: string;
			name?: string;
		}>;
		sms?: Array<{
			userId: string;
			phone: string;
		}>;
	};
};
