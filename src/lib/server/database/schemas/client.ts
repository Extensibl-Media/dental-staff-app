import {
	pgTable,
	text,
	timestamp,
	boolean,
	pgEnum,
	date,
	smallint,
	jsonb
} from 'drizzle-orm/pg-core';
import { userTable } from './auth';
import { regionTable } from './region';
import { candidateProfileTable } from './candidate';

export type DaySchedule = {
	openTime: string; // ISO time with timezone e.g. "09:00:00-05"
	closeTime: string; // ISO time with timezone e.g. "17:00:00-05"
	isClosed: boolean;
	timezone: string; // IANA timezone e.g. "America/New_York"
};

export type OperatingHours = {
	[key: number]: DaySchedule;
};

export const clientProfileTable = pgTable('client_profiles', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	birthday: date('birthday')
	// stripeCustomerId: text('stripe_customer_id')
});

export const clientSubscriptionTable = pgTable('client_subscriptions', {
	id: text('id').notNull().primaryKey(),
	clientId: text('client_id')
		.notNull()
		.references(() => clientProfileTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	status: text('subscription_status'),
	stripeCustomerId: text('stripe_customer_id'),
	priceId: text('price_id')
});

export const clientCompanyTable = pgTable('client_companies', {
	id: text('id').notNull().primaryKey(),
	clientId: text('client_id')
		.notNull()
		.references(() => clientProfileTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	companyName: text('company_name'),
	licenseNumber: text('license_number').unique(),
	companyLogo: text('company_logo'),
	companyDescription: text('company_description'),
	baseLocation: text('base_location'),
	operatingHours: jsonb('operating_hours')
		.$type<OperatingHours>()
		.default({
			0: {
				openTime: '00:00:00-05',
				closeTime: '00:00:00-05',
				isClosed: true,
				timezone: 'America/New_York'
			},
			1: {
				openTime: '09:00:00-05',
				closeTime: '17:00:00-05',
				isClosed: false,
				timezone: 'America/New_York'
			},
			2: {
				openTime: '09:00:00-05',
				closeTime: '17:00:00-05',
				isClosed: false,
				timezone: 'America/New_York'
			},
			3: {
				openTime: '09:00:00-05',
				closeTime: '17:00:00-05',
				isClosed: false,
				timezone: 'America/New_York'
			},
			4: {
				openTime: '09:00:00-05',
				closeTime: '17:00:00-05',
				isClosed: false,
				timezone: 'America/New_York'
			},
			5: {
				openTime: '09:00:00-05',
				closeTime: '17:00:00-05',
				isClosed: false,
				timezone: 'America/New_York'
			},
			6: {
				openTime: '09:00:00-05',
				closeTime: '17:00:00-05',
				isClosed: false,
				timezone: 'America/New_York'
			}
		})
});

export const companyOfficeLocationTable = pgTable('company_office_locations', {
	id: text('id').notNull().primaryKey(),
	companyId: text('company_id')
		.notNull()
		.references(() => clientCompanyTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	name: text('location_name').notNull(),
	streetOne: text('street_one'),
	streetTwo: text('street_two'),
	city: text('city'),
	state: text('state'),
	zipcode: text('zipcode'),
	companyPhone: text('company_phone'),
	cellPhone: text('cell_phone'),
	hoursOfOperation: text('hours_of_operation'),
	email: text('email'),
	regionId: text('region_id').references(() => regionTable.id, { onDelete: 'set null' })
});

export const staffRoleEnum = pgEnum('staff_roles', [
	'CLIENT_ADMIN',
	'CLIENT_MANAGER',
	'CLIENT_EMPLOYEE'
]);

export const clientStaffProfileTable = pgTable('client_staff', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	clientId: text('client_id')
		.notNull()
		.references(() => clientProfileTable.id, { onDelete: 'cascade' }),
	companyId: text('company_id')
		.notNull()
		.references(() => clientCompanyTable.id, { onDelete: 'cascade' }),
	staffRole: staffRoleEnum('staff_role').default('CLIENT_EMPLOYEE'),
	birthday: date('birthday')
});

export const clientStaffLocationTable = pgTable('client_staff_locations', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	companyId: text('company_id')
		.notNull()
		.references(() => clientCompanyTable.id, { onDelete: 'cascade' }),
	staffId: text('staff_id')
		.notNull()
		.references(() => clientStaffProfileTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	locationId: text('location_id')
		.notNull()
		.references(() => companyOfficeLocationTable.id, { onDelete: 'cascade' }),
	isPrimary: boolean('is_primary_location').default(false)
});

export const clientRatingTable = pgTable('client_ratings', {
	id: text('id').notNull().primaryKey(),
	clientCompanyId: text('client_company_id')
		.notNull()
		.references(() => clientCompanyTable.id, { onDelete: 'cascade' }),
	ratedById: text('rated_by_id')
		.notNull()
		.references(() => candidateProfileTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	notes: text('notes'),
	rating: smallint('rating').notNull()
});

export type ClientProfile = typeof clientProfileTable.$inferInsert;
export type ClientCompany = typeof clientCompanyTable.$inferInsert;
export type ClientCompanyLocation = typeof companyOfficeLocationTable.$inferInsert;
export type ClientCompanyStaffProfile = typeof clientStaffProfileTable.$inferInsert;
export type ClientCompanyStaffLocation = typeof clientStaffLocationTable.$inferSelect;
export type NewClientCompanyStaffLocation = typeof clientStaffLocationTable.$inferInsert;
export type ClientRating = typeof clientRatingTable.$inferInsert;

export type UpdateClientProfile = Partial<typeof clientProfileTable.$inferInsert>;
export type UpdateClientCompany = Partial<typeof clientCompanyTable.$inferInsert>;
export type UpdateClientCompanyLocation = Partial<typeof companyOfficeLocationTable.$inferInsert>;
export type UpdateClientCompanyStaffProfile = Partial<typeof clientStaffProfileTable.$inferInsert>;
export type UpdateClientCompanyStaffLocation = Partial<
	typeof clientStaffLocationTable.$inferInsert
>;
export type ClientProfileSelect = typeof clientProfileTable.$inferSelect;
