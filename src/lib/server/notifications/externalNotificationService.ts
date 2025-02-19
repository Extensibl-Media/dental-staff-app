/* eslint-disable @typescript-eslint/no-explicit-any */
import * as brevo from '@getbrevo/brevo';
import { eq, desc } from 'drizzle-orm';
import {
	externalNotificationTemplatesTable,
	type ExternalNotificationType
} from '../database/schemas/notification';

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

export type SmsConfig = {
	from: string;
};

export type CreateTemplateParams = {
	name: string;
	description?: string;
	type: ExternalNotificationType;
	template: string;
	requiredSources: Record<string, string[]>;
	createdBy: string;
};

export type SendEmailParams = {
	templateId: string;
	to: Array<{ email: string; name?: string }>;
	data: Record<string, any>;
};

export type SendSmsParams = {
	templateId: string;
	to: string[];
	data: Record<string, any>;
};

export class ExternalNotificationService {
	private readonly emailApi: brevo.TransactionalEmailsApi;
	private readonly smsApi: brevo.TransactionalSMSApi;

	constructor(
		private db: any,
		emailApiKey: string,
		private emailConfig: EmailConfig,
		private smsApiKey: string,
		private smsConfig: SmsConfig
	) {
		this.emailApi = new brevo.TransactionalEmailsApi();
		this.emailApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, emailApiKey);

		this.smsApi = new brevo.TransactionalSMSApi();
		this.smsApi.setApiKey(brevo.TransactionalSMSApiApiKeys.apiKey, smsApiKey);
	}

	// Template Management
	async createTemplate({
		name,
		description,
		type,
		template,
		requiredSources,
		createdBy
	}: CreateTemplateParams) {
		return await this.db
			.insert(externalNotificationTemplatesTable)
			.values({
				name,
				description,
				type,
				template,
				requiredSources,
				createdBy,
				...(type === 'EMAIL' ? { emailSubject: name } : {})
			})
			.returning();
	}

	async getTemplate(id: string) {
		const [template] = await this.db
			.select()
			.from(externalNotificationTemplatesTable)
			.where(eq(externalNotificationTemplatesTable.id, id));
		return template;
	}

	async getTemplates() {
		return await this.db
			.select()
			.from(externalNotificationTemplatesTable)
			.orderBy(desc(externalNotificationTemplatesTable.createdAt));
	}

	private processTemplate(template: string, data: Record<string, any>): string {
		return template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
			const [table, field] = variable.split('.');
			return data[table]?.[field] ?? match;
		});
	}

	// Email sending
	async sendEmail({ templateId, to, data }: SendEmailParams) {
		const template = await this.getTemplate(templateId);
		if (!template) {
			throw new Error('Template not found');
		}

		if (template.type !== 'EMAIL') {
			throw new Error('Template is not an email template');
		}

		try {
			const sendSmtpEmail = new brevo.SendSmtpEmail();

			sendSmtpEmail.sender = this.emailConfig.from;
			sendSmtpEmail.to = to;
			sendSmtpEmail.subject = template.emailSubject
				? this.processTemplate(template.emailSubject, data)
				: template.name;
			sendSmtpEmail.htmlContent = this.processTemplate(template.template, data);

			if (this.emailConfig.replyTo) {
				sendSmtpEmail.replyTo = this.emailConfig.replyTo;
			}

			sendSmtpEmail.params = data;

			await this.emailApi.sendTransacEmail(sendSmtpEmail);
		} catch (error) {
			console.error('Failed to send email:', error);
			throw new Error('Failed to send email');
		}
	}

	// SMS sending
	async sendSms({ templateId, to, data }: SendSmsParams) {
		const template = await this.getTemplate(templateId);
		if (!template) {
			throw new Error('Template not found');
		}

		if (template.type !== 'SMS') {
			throw new Error('Template is not an SMS template');
		}

		try {
			const content = this.processTemplate(template.template, data);

			await Promise.all(
				to.map((recipient) =>
					this.smsApi.sendTransacSms({
						sender: this.smsConfig.from,
						recipient,
						content
					})
				)
			);
		} catch (error) {
			console.error('Failed to send SMS:', error);
			throw new Error('Failed to send SMS');
		}
	}
}
