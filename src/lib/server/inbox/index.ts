import type { Message } from 'postcss';
import { z } from 'zod';
import type { Conversation, ConversationParticipant } from '../database/schemas/messages';
export { InboxService } from './service';

export type ConversationType = 'INTERNAL' | 'APPLICATION' | 'ADMIN_CLIENT' | 'ADMIN_CANDIDATE';

export type ParticipantType = 'SUPERADMIN' | 'CLIENT' | 'CLIENT_STAFF' | 'CANDIDATE';
// // Additional useful types
export type MessageWithSender = Message & {
	sender?: {
		id: string;
		name: string;
		avatar?: string;
	};
};

export type ConversationWithDetails = Conversation & {
	participants: ConversationParticipant[];
	lastMessage?: Message;
	unreadCount?: number;
};

// Schema for message queries/filters
export const messageQuerySchema = z.object({
	conversationId: z.string(),
	limit: z.number().min(1).max(100).default(50),
	beforeId: z.number().optional(),
	afterId: z.number().optional(),
	senderId: z.string().optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional()
});

export type MessageQueryParams = z.infer<typeof messageQuerySchema>;

// Schema for conversation queries/filters
export const conversationQuerySchema = z.object({
	userId: z.string(),
	type: z.enum(['INTERNAL', 'APPLICATION', 'ADMIN_CLIENT', 'ADMIN_CANDIDATE']).optional(),
	applicationId: z.string().optional(),
	participantId: z.string().optional(),
	isActive: z.boolean().default(true),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0)
});

export type ConversationQueryParams = z.infer<typeof conversationQuerySchema>;

// Schema for creating new conversations
export const createConversationSchema = z.object({
	type: z.enum(['INTERNAL', 'APPLICATION', 'ADMIN_CLIENT', 'ADMIN_CANDIDATE']),
	participants: z
		.array(
			z.object({
				userId: z.string(),
				participantType: z.enum(['ADMIN', 'CLIENT_STAFF', 'CANDIDATE'])
			})
		)
		.min(2),
	applicationId: z.string().optional(),
	initialMessage: z.string().optional()
});

export type CreateConversationParams = z.infer<typeof createConversationSchema>;

// Schema for message operations
export const sendMessageSchema = z.object({
	conversationId: z.string(),
	senderId: z.string(),
	body: z.string().min(1),
	isSystemMessage: z.boolean().default(false)
});

export type SendMessageParams = z.infer<typeof sendMessageSchema>;

// Example usage of types and schemas:
export const validateAndFormatMessage = (input: unknown): SendMessageParams => {
	return sendMessageSchema.parse(input);
};

export const validateMessageQuery = (input: unknown): MessageQueryParams => {
	return messageQuerySchema.parse(input);
};

export const validateConversationCreation = (input: unknown): CreateConversationParams => {
	return createConversationSchema.parse(input);
};

// Helper function to format API responses
export const formatMessageResponse = (message: Message): MessageWithSender => {
	return {
		...message,
		sender: undefined // You would populate this from your user service
	};
};

export const formatConversationResponse = (
	conversation: Conversation,
	participants: ConversationParticipant[],
	lastMessage?: Message,
	unreadCount = 0
): ConversationWithDetails => {
	return {
		...conversation,
		participants,
		lastMessage,
		unreadCount
	};
};
export type ConversationWithParticipants = {
	id: string;
	type: ConversationType;
	participants: {
		userId: string;
		participantType: ParticipantType;
	}[];
	lastMessage?: {
		id: number;
		body: string;
		senderId: string;
		createdAt: Date;
	};
	unreadCount: number;
};
