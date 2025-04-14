import { and, desc, eq } from 'drizzle-orm';
import db from '../drizzle';
import {
	supportTicketCommentTable,
	supportTicketTable,
	type SupportTicket,
	type SupportTicketComment,
	type UpdateSuportTicket
} from '../schemas/admin';
import { userTable } from '../schemas/auth';
import { error } from '@sveltejs/kit';

export interface SupportTicketResult {
	supportTicket: SupportTicket;
	reportedBy: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		avatarUrl: string;
	};
}

export async function createSupportTicket(data: SupportTicket) {
	try {
		const [result] = await db
			.insert(supportTicketTable)
			.values(data)
			.onConflictDoNothing()
			.returning();
		return result;
	} catch (err) {
		console.log(err);
		return error(500, `${err}`);
	}
}

export async function getAllSupportTickets() {
	return await db
		.select({
			supportTicket: { ...supportTicketTable },
			reportedBy: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatraUrl: userTable.avatarUrl
			}
		})
		.from(supportTicketTable)
		.innerJoin(userTable, eq(supportTicketTable.reportedById, userTable.id))
		.orderBy(desc(supportTicketTable.createdAt));
}

export async function getSupportTicketsForUser(userID?: string) {
	if (!userID) return error(400, 'User ID required');
	return await db
		.select({
			supportTicket: { ...supportTicketTable },
			reportedBy: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			}
		})
		.from(supportTicketTable)
		.innerJoin(userTable, eq(supportTicketTable.reportedById, userTable.id))
		.where(eq(supportTicketTable.reportedById, userID))
		.orderBy(desc(supportTicketTable.updatedAt));
}
export async function getSupportTicketsForUserWithLimit(userID: string, count: number) {
	if (!userID) return error(400, 'User ID required');
	return await db
		.select({
			supportTicket: { ...supportTicketTable },
			reportedBy: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			}
		})
		.from(supportTicketTable)
		.innerJoin(userTable, eq(supportTicketTable.reportedById, userTable.id))
		.where(eq(supportTicketTable.reportedById, userID))
		.orderBy(desc(supportTicketTable.updatedAt))
		.limit(count);
}

export async function closeSupportTicket(ticketId: string, closedById: string) {
	return await db
		.update(supportTicketTable)
		.set({ closedById: closedById })
		.where(eq(supportTicketTable.id, ticketId))
		.returning();
}

export async function updateSuportTicket(ticketId: string, data: UpdateSuportTicket) {
	return await db.update(supportTicketTable).set(data).where(eq(supportTicketTable.id, ticketId));
}

export async function deleteSupportTicket(ticketId: string) {
	return await db.delete(supportTicketTable).where(eq(supportTicketTable.id, ticketId));
}

export async function getSupportTicketDetails(ticketId: string) {
	const ticket = await db
		.select({
			ticket: supportTicketTable,
			reportedBy: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl,
				role: userTable.role
			}
		})
		.from(supportTicketTable)
		.leftJoin(userTable, eq(supportTicketTable.reportedById, userTable.id))
		.where(eq(supportTicketTable.id, ticketId));

	if (!ticket || ticket.length === 0) {
		throw new Error('TICKET NOT FOUND');
	}

	const closedByUser = await db
		.select({
			id: userTable.id,
			firstName: userTable.firstName,
			lastName: userTable.lastName,
			email: userTable.email,
			avatarUrl: userTable.avatarUrl,
			role: userTable.role
		})
		.from(userTable)
		.where(eq(userTable.id, ticket[0].ticket.closedById as string));

	const comments = await db
		.select({
			comment: supportTicketCommentTable,
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl,
				role: userTable.role
			}
		})
		.from(supportTicketCommentTable)
		.leftJoin(userTable, eq(supportTicketCommentTable.fromId, userTable.id))
		.where(eq(supportTicketCommentTable.supportTicketId, ticketId));

	return {
		details: {
			...ticket[0],
			closedBy: closedByUser[0] || null
		},
		comments
	};
}

export const getSupportTicketComments = async (ticketId: string) => {
	try {
		const result = await db
			.select()
			.from(supportTicketCommentTable)
			.where(eq(supportTicketCommentTable.supportTicketId, ticketId));

		return result || [];
	} catch (err) {
		console.log(err);
		return error(500, `${err}`);
	}
};

export const createSupportTicketComment = async (data: SupportTicketComment) => {
	try {
		const [result] = await db
			.insert(supportTicketCommentTable)
			.values(data)
			.onConflictDoNothing()
			.returning();
		return result;
	} catch (err) {
		console.log(err);
		return error(500, `${err}`);
	}
};

export const updateSupportTicket = async (ticketId: string, data: UpdateSuportTicket) => {
	try {
		const [result] = await db
			.update(supportTicketTable)
			.set(data)
			.where(eq(supportTicketTable.id, ticketId))
			.returning();
		return result;
	} catch (err) {
		console.log(err);
		return error(500, `${err}`);
	}
};
