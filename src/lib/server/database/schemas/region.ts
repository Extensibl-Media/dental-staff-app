import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const regionTable = pgTable('regions', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	name: text('name').notNull(),
	abbreviation: text('abbreviation').notNull()
});

export const subRegionTable = pgTable('subregion', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	regionId: text('region_id')
		.notNull()
		.references(() => regionTable.id, { onDelete: 'cascade' }),
	name: text('name').notNull()
});

export const subregionZipcodeTable = pgTable('subregion_zipcodes', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	code: text('code').notNull(),
	subregionId: text('subregion_id')
		.notNull()
		.references(() => subRegionTable.id, { onDelete: 'cascade' })
});

export type Region = typeof regionTable.$inferInsert;
export type Subregion = typeof subRegionTable.$inferInsert;
export type SubregionZipcode = typeof subregionZipcodeTable.$inferInsert;
export type UpdateRegion = Partial<typeof regionTable.$inferInsert>;
export type UpdateSubregion = Partial<typeof subRegionTable.$inferInsert>;
export type UpdateSubregionZipcode = Partial<typeof subregionZipcodeTable.$inferInsert>;
