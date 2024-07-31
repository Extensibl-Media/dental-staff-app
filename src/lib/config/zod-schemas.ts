import { z } from 'zod';

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

export const userUpdatePasswordSchema = userSchema
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

export type UserUpdatePasswordSchema = typeof userUpdatePasswordSchema;

export const clientCompanySchema = z.object({
	companyName: z.string().min(1, { message: 'Company Name is required' }).trim()
});

export type ClientCompanySchema = typeof clientCompanySchema;

export const clientCompanyLocationSchema = z.object({
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
	phoneNumberType: z.union([z.literal('cell'), z.literal('office')]).optional()
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

export const newExperienceLevelSchema = z.object({
	value: z.string()
});

export type NewExperienceLevelSchema = typeof newExperienceLevelSchema;

export const adminRequisitionSchema = z.object({
	title: z.string(),
	clientId: z.string(),
	locationId: z.string(),
	disciplineId: z.string(),
	experienceLevelId: z.string().optional(),
	jobDescription: z.string(),
	specialInstructions: z.string().optional()
});

export type AdminRequisitionSchema = typeof adminRequisitionSchema;

export const clientRequisitionSchema = z.object({
	title: z.string(),
	clientId: z.string(),
	locationId: z.string(),
	disciplineId: z.string(),
	experienceLevelId: z.string().optional(),
	jobDescription: z.string(),
	specialInstructions: z.string().optional()
});

export type ClientRequisitionSchema = typeof adminRequisitionSchema;

export const newRecurrenceDaySchema = z.object({
	requisitionId: z.string(),
	date: z.string(),
	dayStartTime: z.string(),
	dayEndTime: z.string(),
	lunchStartTime: z.string(),
	lunchEndTime: z.string(),
	timezoneOffset: z.string()
});

export type NewRecurrenceDaySchema = typeof newRecurrenceDaySchema;

export const editRecurrenceDaySchema = newRecurrenceDaySchema.extend({
	id: z.string()
});

export type EditRecurrenceDaySchema = typeof editRecurrenceDaySchema;

export const deleteRecurrenceDaySchema = z.object({
	id: z.string()
});

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
