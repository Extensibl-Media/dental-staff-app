// import {
// 	pgTable,
// 	text,
// 	timestamp,
// 	boolean,
// 	smallint,
// 	date,
// 	pgEnum,
// 	index
// } from 'drizzle-orm/pg-core';
// import { userTable } from './auth';

// const notificationStatusEnum = pgEnum('notification_status', ['UNREAD', 'READ']);

// export const notificationsTable = pgTable(
// 	'notifications',
// 	{
// 		id: text('id').notNull().primaryKey(),
// 		createdAt: timestamp('created_at', {
// 			withTimezone: true,
// 			mode: 'date'
// 		}).notNull(),
// 		updatedAt: timestamp('updated_at', {
// 			withTimezone: true,
// 			mode: 'date'
// 		}).notNull(),
// 		notificationObjectId: text('notification_object_id')
// 			.notNull()
// 			.references(() => notificationObjectTable.id, { onDelete: 'cascade' }),
// 		status: notificationStatusEnum('status').default('UNREAD'),
// 		notifierId: text('notifier_id')
// 			.notNull()
// 			.references(() => userTable.id, { onDelete: 'cascade' })
// 	},
// 	(table) => ({
// 		notificationOjIdIdx: index('notification_object_id_idx').on(table.notificationObjectId).asc()
// 	})
// );

// export const notificationObjectTable = pgTable('notification_objects', {
// 	id: text('id').notNull().primaryKey(),
// 	createdAt: timestamp('created_at', {
// 		withTimezone: true,
// 		mode: 'date'
// 	}).notNull(),
// 	updatedAt: timestamp('updated_at', {
// 		withTimezone: true,
// 		mode: 'date'
// 	}).notNull(),
// 	entytyTypeId: smallint('entity_type_id').notNull(),
// 	entityId: text('entity_id').notNull()
// });
