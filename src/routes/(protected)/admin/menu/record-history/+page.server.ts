import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import db from '$lib/server/database/drizzle';
import { actionHistoryTable } from '$lib/server/database/schemas/admin';
import { userTable } from '$lib/server/database/schemas/auth';
import { eq, or, ilike, desc, and, gte, lte } from 'drizzle-orm';
export const load: PageServerLoad = async (event) => {
	const searchTerm = event.url.searchParams.get('search') || '';
	const startDate = event.url.searchParams.get('startDate') || '';
	const endDate = event.url.searchParams.get('endDate') || '';
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user && user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	try {
		// Build the where conditions
		const conditions = [];

		// Search filter
		if (searchTerm) {
			const searchWords = searchTerm.trim().split(/\s+/);

			// If multiple words, try to match as full name (first + last)
			if (searchWords.length >= 2) {
				conditions.push(
					or(
						// Try matching first and last name
						and(
							ilike(userTable.firstName, `%${searchWords[0]}%`),
							ilike(userTable.lastName, `%${searchWords.slice(1).join(' ')}%`)
						),
						// Try matching last and first name (reversed)
						and(
							ilike(userTable.lastName, `%${searchWords[0]}%`),
							ilike(userTable.firstName, `%${searchWords.slice(1).join(' ')}%`)
						),
						// Also search in other fields with full term
						ilike(actionHistoryTable.entityType, `%${searchTerm}%`),
						ilike(actionHistoryTable.entityId, `%${searchTerm}%`),
						ilike(actionHistoryTable.action, `%${searchTerm}%`),
						ilike(userTable.email, `%${searchTerm}%`)
					)
				);
			} else {
				// Single word search - search across all fields
				conditions.push(
					or(
						ilike(actionHistoryTable.entityType, `%${searchTerm}%`),
						ilike(actionHistoryTable.entityId, `%${searchTerm}%`),
						ilike(actionHistoryTable.action, `%${searchTerm}%`),
						ilike(userTable.firstName, `%${searchTerm}%`),
						ilike(userTable.lastName, `%${searchTerm}%`),
						ilike(userTable.email, `%${searchTerm}%`)
					)
				);
			}
		}

		// Date range filters
		if (startDate) {
			conditions.push(gte(actionHistoryTable.createdAt, new Date(startDate)));
		}
		if (endDate) {
			const endDateTime = new Date(endDate);
			endDateTime.setHours(23, 59, 59, 999);
			conditions.push(lte(actionHistoryTable.createdAt, endDateTime));
		}

		// Fetch all history records with user information
		const history = await db
			.select({
				id: actionHistoryTable.id,
				createdAt: actionHistoryTable.createdAt,
				updatedAt: actionHistoryTable.updatedAt,
				entityId: actionHistoryTable.entityId,
				entityType: actionHistoryTable.entityType,
				userId: actionHistoryTable.userId,
				action: actionHistoryTable.action,
				changes: actionHistoryTable.changes,
				metadata: actionHistoryTable.metadata,
				userFirstName: userTable.firstName,
				userLastName: userTable.lastName,
				userEmail: userTable.email
			})
			.from(actionHistoryTable)
			.leftJoin(userTable, eq(actionHistoryTable.userId, userTable.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(actionHistoryTable.createdAt));

		return {
			history: history || []
		};
	} catch (e) {
		console.error('Error loading record history:', e);
		return {
			history: []
		};
	}
};
