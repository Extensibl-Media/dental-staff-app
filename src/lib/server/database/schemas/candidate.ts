import {
	pgTable,
	text,
	timestamp,
	smallint,
	date,
	pgEnum,
	boolean,
	primaryKey,
	uuid
} from 'drizzle-orm/pg-core';
import { userTable } from './auth';
import { disciplineTable, experienceLevelTable } from './skill';
import { clientCompanyTable } from './client';
import { regionTable } from './region';

export const candidateStatusEnum = pgEnum('candidate_status', ['INACTIVE', 'PENDING', 'ACTIVE']);

export const candidateProfileTable = pgTable('candidate_profiles', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.default(new Date()),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.default(new Date()),
	address: text('address'),
	hourlyRateMin: smallint('hourly_rate_min').notNull(),
	hourlyRateMax: smallint('hourly_rate_max').notNull(),
	status: candidateStatusEnum('candidate_status').default('PENDING'),
	city: text('city'),
	state: text('state'),
	zipcode: text('zipcode'),
	employeeNumber: text('employee_number'),
	cellPhone: text('cell_phone'),
	citizenship: text('citizenship'),
	birthday: date('birthday'),
	avgRating: smallint('avg_rating').default(0),
	regionId: text('region_id').references(() => regionTable.id, { onDelete: 'set null' }),
	featureMe: boolean('feature_me').default(false),
	approved: boolean('approved').default(false)
});

export const candidateRatingTable = pgTable('candidate_ratings', {
	id: text('id').notNull().primaryKey(),
	candidateId: text('candidate_id')
		.notNull()
		.references(() => candidateProfileTable.id, { onDelete: 'cascade' }),
	ratedById: text('rated_by_id')
		.notNull()
		.references(() => clientCompanyTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.default(new Date()),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.default(new Date()),
	notes: text('notes'),
	rating: smallint('rating').notNull()
});

export const candidateBlacklistTable = pgTable(
	'candidate_blacklists',
	{
		candidateId: text('candidate_id')
			.notNull()
			.references(() => candidateProfileTable.id, { onDelete: 'cascade' }),
		companyId: text('company_id')
			.notNull()
			.references(() => clientCompanyTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'date'
		})
			.notNull()
			.defaultNow()
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.candidateId, table.companyId] })
		};
	}
);

export const candidateDisciplineExperienceTable = pgTable(
	'candidate_discipline_experience',
	{
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'date'
		})
			.notNull()
			.default(new Date()),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'date'
		})
			.notNull()
			.default(new Date()),
		candidateId: text('candidate_id')
			.notNull()
			.references(() => candidateProfileTable.id, { onDelete: 'cascade' }),
		experienceLevelId: text('experience_level_id')
			.notNull()
			.references(() => experienceLevelTable.id, { onDelete: 'cascade' }),
		disciplineId: text('discipline_id')
			.notNull()
			.references(() => disciplineTable.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.candidateId, t.disciplineId] }) })
);

export const candidateDocumentUploadsTable = pgTable('candidate_document_uploads', {
	id: uuid('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.default(new Date()),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.default(new Date()),
	candidateId: text("candidate_id").references(() => candidateProfileTable.id).notNull(),
	uploadUrl: text("upload_url").notNull(),
	expiryDate: timestamp('expiry_date', {
		withTimezone: true,
		mode: 'date'
	})
})

export type CandidateProfile = typeof candidateProfileTable.$inferInsert;
export type CandidateProfileSelect = typeof candidateProfileTable.$inferSelect;
export type UpdateCandidateProfile = Partial<typeof candidateProfileTable.$inferInsert>;
export type CandidateRating = typeof candidateRatingTable.$inferInsert;
