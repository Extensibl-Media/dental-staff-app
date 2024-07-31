import { pgTable, text, timestamp, integer, serial, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import { userTable } from './auth';

export const messageStatusEnum = pgEnum('message_status', ['READ', 'UNREAD']);

export const conversationTable = pgTable('conversations', {
	id: text('id').notNull().primaryKey(),
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
	lastMessageId: integer('last_message_id')
});

export const messageTable = pgTable('messages', {
	id: serial('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.default(new Date()),
	body: text('body').notNull(),
	senderId: text('sender_id').notNull(),
	status: messageStatusEnum('status').default('UNREAD'),
	conversationId: text('conversation_id')
		.references(() => conversationTable.id, { onDelete: 'cascade' })
		.notNull()
});

// Participants table (for linking users to conversations)
export const conversationParticipantsTable = pgTable(
	'conversation_participants',
	{
		userId: text('user_id')
			.references(() => userTable.id)
			.notNull(),
		conversationId: text('conversation_id')
			.references(() => conversationTable.id, { onDelete: 'cascade' })
			.notNull(),
		joinedAt: timestamp('joined_at').defaultNow().notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.conversationId, t.userId] })
	})
);

export type Message = typeof messageTable.$inferInsert;
export type Conversation = typeof conversationTable.$inferInsert;
export type ConversationParticipant = typeof conversationParticipantsTable.$inferInsert;
