import { time } from 'drizzle-orm/mysql-core';
import { z } from 'zod';

export type Primitive = string | number | boolean | null;

export type JsonType = Primitive | { [key: PropertyKey]: JsonType } | JsonType[];

export const zJsonString = z.string().transform((str, ctx): JsonType => {
	try {
		return JSON.parse(str);
	} catch (e) {
		ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
		return z.NEVER;
	}
});

export const userSchema = z.object({
	firstName: z
		.string({ required_error: 'First Name is required' })
		.min(1, { message: 'First Name is required' })
		.trim(),
	lastName: z
		.string({ required_error: 'Last Name is required' })
		.min(1, { message: 'Last Name is required' })
		.trim(),
	email: z
		.string({ required_error: 'Email is required' })
		.email({ message: 'Please enter a valid email address' }),
	password: z
		.string({ required_error: 'Password is required' })
		.min(6, { message: 'Password must be at least 6 characters' })
		.trim(),
	confirmPassword: z
		.string({ required_error: 'Password is required' })
		.min(6, { message: 'Password must be at least 6 characters' })
		.trim(),
	//terms: z.boolean({ required_error: 'You must accept the terms and privacy policy' }),
	role: z.enum(['CANDIDATE', 'CLIENT', 'SUPERADMIN'], { required_error: 'You must have a role' }),
	verified: z.boolean().default(false),
	terms: z.literal<boolean>(true, {
		errorMap: () => ({ message: 'You must accept the terms & privacy policy' })
	}),
	token: z.string().optional(),
	receiveEmail: z.boolean().default(true),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional()
});

export type UserSchema = typeof userSchema;

export const userResetPasswordSchema = userSchema
	.pick({ password: true, confirmPassword: true })
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				code: 'custom',
				message: 'Password and Confirm Password must match',
				path: ['password']
			});
			ctx.addIssue({
				code: 'custom',
				message: 'Password and Confirm Password must match',
				path: ['confirmPassword']
			});
		}
	});

export type UserResetPasswordSchema = typeof userResetPasswordSchema;

export const userUpdatePasswordSchema = z
	.object({ password: z.string(), newPassword: z.string(), confirmPassword: z.string() })
	.superRefine(({ confirmPassword, newPassword }, ctx) => {
		if (confirmPassword !== newPassword) {
			ctx.addIssue({
				code: 'custom',
				message: 'Password and Confirm Password must match',
				path: ['confirmPassword']
			});
		}
	});

export type UserUpdatePasswordSchema = typeof userUpdatePasswordSchema;

export const clientCompanySchema = z.object({
	companyName: z.string().min(1, { message: 'Company Name is required' }).trim(),
	companyDescription: z.string(),
	baseLocation: z.string(),
	operatingHours: z.string(),
	companyLogo: z.string()
});

export type ClientCompanySchema = typeof clientCompanySchema;

export const clientCompanyLocationSchema = z.object({
	companyId: z.string(),
	name: z.string(),
	streetOne: z.string().optional(),
	streetTwo: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	zipcode: z.string().optional(),
	companyPhone: z.string().optional(),
	hoursOfOperation: z.string().optional(),
	email: z.string().optional(),
	phoneNumber: z.string().optional(),
	phoneNumberType: z.union([z.literal('cell'), z.literal('office')]).optional(),
	timezone: z.string().optional()
});

export type CompanyLocationSchema = typeof clientCompanyLocationSchema;

export const newDisciplineSchema = z.object({
	name: z.string(),
	abbreviation: z.string()
});

export type NewDisciplineSchema = typeof newDisciplineSchema;

export const newSkillSchema = z.object({
	name: z.string(),
	categoryId: z.string()
});

export type NewSkillSchema = typeof newSkillSchema;

export const newCategorySchema = z.object({
	name: z.string()
});

export type NewCategorySchema = typeof newSkillSchema;

export const deleteCategorySchema = z.object({
	id: z.string()
});
export type DeleteCategorySchema = typeof deleteCategorySchema;

export const newExperienceLevelSchema = z.object({
	value: z.string()
});

export type NewExperienceLevelSchema = typeof newExperienceLevelSchema;

export const adminRequisitionSchema = z.object({
	title: z.string(),
	clientId: z.string(),
	locationId: z.string(),
	disciplineId: z.string(),
	hourlyRate: z.string(),
	experienceLevelId: z.string().optional(),
	jobDescription: z.string(),
	specialInstructions: z.string().optional(),
	permanentPosition: z.boolean().default(false),
	timezone: z.string()
});

export type AdminRequisitionSchema = typeof adminRequisitionSchema;

export const clientRequisitionSchema = z.object({
	title: z.string(),
	clientId: z.string(),
	locationId: z.string(),
	disciplineId: z.string(),
	hourlyRate: z.string(),
	experienceLevelId: z.string().optional(),
	jobDescription: z.string(),
	specialInstructions: z.string().optional(),
	permanentPosition: z.boolean().default(false),
	timezone: z.string()
});

export type ClientRequisitionSchema = typeof clientRequisitionSchema;
const singleDaySchema = z.object({
	requisitionId: z.string(),
	date: z.string(),
	dayStartTime: z.string(),
	dayEndTime: z.string(),
	lunchStartTime: z.string(),
	lunchEndTime: z.string()
});

const recurrenceDayData = z.object({
	requisitionId: z.number(),
	date: z.string(),
	dayStartTime: z.string(),
	dayEndTime: z.string(),
	lunchStartTime: z.string(),
	lunchEndTime: z.string()
});

export const newRecurrenceDaySchema = z.object({
	recurrenceDays: z.string().transform((str) => {
		const parsed = JSON.parse(str);
		return z.array(recurrenceDayData).parse(Array.isArray(parsed) ? parsed : [parsed]);
	})
});

export type RecurrenceDayData = z.infer<typeof recurrenceDayData>;
export type NewRecurrenceDaySchema = typeof newRecurrenceDaySchema;
export const editRecurrenceDaySchema = singleDaySchema.extend({ id: z.string() });
export type EditRecurrenceDaySchema = typeof editRecurrenceDaySchema;
export const deleteRecurrenceDaySchema = z.object({ id: z.string() });
export type DeleteRecurrenceDaySchema = typeof deleteRecurrenceDaySchema;

export const changeStatusSchema = z.object({
	status: z.enum(['PENDING', 'OPEN', 'FILLED', 'UNFULFILLED', 'CANCELED']),
	requisitionId: z.string()
});

export type ChangeStatusSchema = typeof changeStatusSchema;

export const newRegionSchema = z.object({
	name: z.string(),
	abbreviation: z.string()
});

export type NewRegionSchema = typeof newRegionSchema;

export const newMessageSchema = z.object({
	body: z.string()
});

export type NewMessageSchema = typeof newMessageSchema;

export const newSupportTicketSchema = z.object({
	title: z.string({ required_error: 'This field is required' }).min(1, 'This field is required.'),
	actualResults: z
		.string({ required_error: 'This field is required' })
		.min(1, 'This field is required.'),
	expectedResults: z
		.string({ required_error: 'This field is required' })
		.min(1, 'This field is required.'),
	stepsToReproduce: z.string().optional(),
	reportedById: z.string()
});

export type NewSupportTicketSchema = typeof newSupportTicketSchema;

export const newCandidateProfileSchema = z.object({
	address: z.string().optional(),
	hourlyRateMin: z.number().optional(),
	hourlyRateMax: z.number().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	zipcode: z.string().optional(),
	cellPhone: z.string().optional(),
	citizenship: z.string().optional(),
	birthday: z.string().optional(),
	regionId: z.string().optional()
});
export type NewCandidateProfileSchema = typeof newCandidateProfileSchema;

export const fileUploadSchema = z.object({
	file: z.instanceof(File, { message: 'Please upload a file.' })
});

export type FileUploadSchema = typeof fileUploadSchema;

export const candidateDocumentUploadSchema = z.object({
	type: z.enum(['RESUME', 'LICENSE', 'CERTIFICATE', 'OTHER']).optional(),
	filename: z.string().optional(),
	url: z.string().optional(),
	urls: z.array(z.string()).optional(),
	createdAt: z.date().optional(),
	filesData: z
		.array(
			z.object({
				filename: z.string(),
				url: z.string()
			})
		)
		.optional()
});

export type CandidateDocumentUploadSchema = typeof candidateDocumentUploadSchema;

export const ApproveTimesheetSchema = z.object({
	id: z.string(),
	entries: z.array(
		z.object({
			workdayId: z.string().min(1, 'Workday ID is required'),
			hours: z.number().min(1, 'Hours worked is required'),
			startTime: z.string().min(1, 'Start time is required'),
			endTime: z.string().min(1, 'End time is required'),
			date: z.string().min(1, 'Date is required')
		})
	),
	totalHours: z.number().min(1, 'Total hours is required')
});

export const NewAddressSchema = z.object({
	streetOne: z.string().min(1, 'Street address is required'),
	streetTwo: z.string().optional(),
	city: z.string().min(1, 'City is required'),
	state: z.string().min(1, 'State is required'),
	zipcode: z.string().min(1, 'Zipcode is required')
});

export const ContactSchema = z.object({
	companyPhone: z.string().optional(),
	email: z.string().email('Invalid email address').optional()
});

export const OperatingHoursSchema = z.object({
	operatingHours: z.string()
});

export const LocationSchema = z.object({
	timezone: z.string().min(1, 'Timezone is required'),
	regionId: z.string().min(1, 'Region ID is required')
});

export const ClientLocationDetailsSchema = NewAddressSchema.merge(ContactSchema).merge(
	z.object({
		name: z.string().min(1, 'Location name is required'),
		timezone: z.string().min(1, 'Timezone is required')
	})
);
export const CandidateStatusSchema = z.object({ status: z.string().min(1), id: z.string().min(1) });
