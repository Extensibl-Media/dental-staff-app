import { and, eq, ne, inArray, asc } from 'drizzle-orm';
import db from '../drizzle';
import {
	conversationParticipantsTable,
	conversationTable,
	messageTable,
	type Conversation,
	type Message
} from '../schemas/messages';
import { userTable } from '../schemas/auth';

export async function getConversationsForUser(userId: string) {
	// First, get all conversation IDs the user is part of
	const userConversations = await db
		.select({ conversationId: conversationParticipantsTable.conversationId })
		.from(conversationParticipantsTable)
		.where(eq(conversationParticipantsTable.userId, userId));

	const conversationIds = userConversations.map((uc) => uc.conversationId);

	if (conversationIds.length === 0) {
		return [];
	}

	// Now query these conversations and their participants
	const result = await db
		.select({
			conversation: {
				id: conversationTable.id,
				createdAt: conversationTable.createdAt,
				updatedAt: conversationTable.updatedAt,
				lastMessageId: conversationTable.lastMessageId
			},
			participant: {
				userId: conversationParticipantsTable.userId,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl
			},
			lastMessage: { ...messageTable }
		})
		.from(conversationTable)
		.innerJoin(
			conversationParticipantsTable,
			eq(conversationTable.id, conversationParticipantsTable.conversationId)
		)
		.innerJoin(
			messageTable,
			and(
				eq(messageTable.id, conversationTable.lastMessageId),
				eq(messageTable.conversationId, conversationTable.id)
			)
		)
		.innerJoin(userTable, eq(conversationParticipantsTable.userId, userTable.id))
		.where(inArray(conversationTable.id, conversationIds));

	// Post-process the results to group participants by conversation
	const conversationsMap = new Map();

	result.forEach((row) => {
		const { conversation, participant, lastMessage } = row;

		if (!conversationsMap.has(conversation.id)) {
			conversationsMap.set(conversation.id, {
				conversation,
				participants: [],
				lastMessage
			});
		}

		conversationsMap.get(conversation.id).participants.push(participant);
	});

	return Array.from(conversationsMap.values());
}

export async function getConversationById(userId: string, chatId: string) {
	const conversationAndUser = await db
		.select({
			conversation: conversationTable,
			chatUser: {
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl,
				role: userTable.role
			}
		})
		.from(conversationTable)
		.leftJoin(
			conversationParticipantsTable,
			eq(conversationTable.id, conversationParticipantsTable.conversationId)
		)
		.leftJoin(
			userTable,
			and(eq(conversationParticipantsTable.userId, userTable.id), ne(userTable.id, userId))
		)
		.where(eq(conversationTable.id, chatId))
		.limit(1);

	const messages = await db
		.select()
		.from(messageTable)
		.where(eq(messageTable.conversationId, chatId))
		.orderBy(asc(messageTable.createdAt));

	const conversation = conversationAndUser[0]?.conversation;
	const chatUser = conversationAndUser[0]?.chatUser;

	return { conversation, messages, chatUser };
}

export async function createNewConversation({
	userId,
	recipientId,
	conversationId
}: {
	userId: string;
	recipientId: string;
	conversationId: string;
}) {
	// create new conversation
	// create new conversation_participants from each user
}

type InsertableMessage = {
	senderId: string;
	conversationId: string;
	body: string;
};

export async function updateConversation(chatId: string, data: Partial<Conversation>) {
	try {
		const result = await db
			.update(conversationTable)
			.set(data)
			.where(eq(conversationTable.id, chatId))
			.returning();

		if (result.length) {
			return result[0];
		} else return null;
	} catch (error) {
		console.log(error);
	}
}

export async function sendNewMessage(data: InsertableMessage) {
	try {
		const result = await db.insert(messageTable).values(data).returning();
		if (result.length) {
			return result[0];
		} else return null;
	} catch (error) {
		console.log(error);
	}
}
