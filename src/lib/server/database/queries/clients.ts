import { desc, eq, count, sql, and, ne, notExists } from 'drizzle-orm';
import db from '$lib/server/database/drizzle';
import {
	clientCompanyTable,
	clientProfileTable,
	clientStaffLocationTable,
	clientStaffProfileTable,
	companyOfficeLocationTable,
	type ClientCompany,
	type ClientCompanyLocation,
	type ClientCompanyStaffProfile,
	type ClientProfile,
	type NewClientCompanyStaffLocation,
	type UpdateClientProfile
} from '../schemas/client';
import { companyStaffInviteLocations, userInviteTable, userTable, type NewUserInvite } from '../schemas/auth';
import { convertRecurrenceDayToEvent } from '$lib/components/calendar/utils';
import { recurrenceDayTable, requisitionTable } from '../schemas/requisition';
import { error } from '@sveltejs/kit';
import { getSupportTicketsForUser, getSupportTicketsForUserWithLimit } from './support';
import {
	getClientCompanyTimesheetDiscrepancies,
	getNewApplicationsCount,
	getRecentRequisitionApplications,
	getRecentTimesheetsDueForClient,
	getTimesheetsDueCount
} from './requisitions';
import { sendClientStaffInviteEmail } from '$lib/config/email-messages';
import type { PaginateOptions } from '$lib/types';

export type ClientWithCompanyRaw = {
	birthday: string | null;
	company_name: string;
	created_at: Date;
	email: string;
	first_name: string;
	id: string;
	last_name: string;
	updated_at: Date;
	user_id: string;
};
export type ClientResults = ClientWithCompanyRaw[];

export type CompanyLocationRaw = {
	id: string;
	company_id: string;
	created_at: string;
	updated_at: string;
	street_one: string;
	street_two: string;
	city: string;
	state: string;
	zipcode: string;
	company_phone: string;
	cell_phone: string;
	hours_of_operation: string;
	email: string;
	region_id: string;
	location_name: string;
};

export type LocationsResults = CompanyLocationRaw[];

export type ClientStaffWithLocationRaw = {
	id: string;
	created_at: Date;
	updated_at: Date;
	user_id: string;
	client_id: string;
	company_id: string;
	staff_role: string;
	birthday: string | null;
	first_name: string;
	last_name: string;
	email: string;
	avatar_url: string | null;
	location_name: string;
	is_primary_location: boolean;
	company_name: string;
};

export type ClientStaffResults = ClientStaffWithLocationRaw[];


export type StaffLocation = {
	id: string;
	name: string;
	streetOne: string | null;
	streetTwo: string | null;
	city: string | null;
	state: string | null;
	zipcode: string | null;
	companyPhone: string | null;
	cellPhone: string | null;
	hoursOfOperation: string | null;
	email: string | null;
	regionId: string | null;
	isPrimary: boolean | null;
};

export async function createClientProfile(values: ClientProfile) {
	const result = await db
		.insert(clientProfileTable)
		.values(values)
		.onConflictDoNothing()
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}
export async function updateClientProfile(clientId: string, values: UpdateClientProfile) {
	const result = await db
		.update(clientProfileTable)
		.set(values)
		.where(eq(clientProfileTable.id, clientId))
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function getClientProfilesCount() {
	const countResult = await db.select({ value: count() }).from(clientProfileTable);

	return countResult[0].value;
}

export async function getPaginatedClientProfiles({
	limit = 25,
	offset = 0,
	orderBy = undefined
}: PaginateOptions) {
	const userCols = ['email', 'first_name', 'last_name'];
	const companyCols = ['company_name'];
	const orderSelector = orderBy
		? userCols.includes(orderBy.column)
			? `u.${orderBy.column}`
			: companyCols.includes(orderBy.column)
				? `${orderBy.column}`
				: `c.${orderBy.column}`
		: null;

	try {
		const query = sql.empty();

		query.append(sql`
		SELECT
			c.*,
			u.first_name,
			u.last_name,
			u.email,
			co.company_name
		FROM ${clientProfileTable} AS c
		INNER JOIN ${userTable} u ON c.user_id = u.id
		INNER JOIN ${clientCompanyTable} co ON c.id = co.client_id
     `);

		if (orderSelector && orderBy) {
			query.append(sql`
		   ORDER BY ${orderBy.direction === 'asc'
					? sql`${sql.raw(orderSelector)} ASC`
					: sql`${sql.raw(orderSelector)} DESC`
				}
		 `);
		} else {
			query.append(sql`
		   ORDER BY c.created_at DESC
		 `);
		}

		query.append(sql`
       LIMIT ${limit}
       OFFSET ${offset}
     `);

		const results = await db.execute(query);

		const count = await getClientProfilesCount();

		return { clients: results.rows, count };
	} catch (err) {
		console.error(err);
	}
}

export async function getAllClientProfiles() {
	const results = await db
		.select({
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
			profile: { ...clientProfileTable },
			company: { ...clientCompanyTable }
		})
		.from(clientProfileTable)
		.innerJoin(clientCompanyTable, eq(clientProfileTable.id, clientCompanyTable.clientId))
		.innerJoin(userTable, eq(clientProfileTable.userId, userTable.id))
		.orderBy(desc(clientProfileTable.createdAt));

	return results;
}

export async function getClientProfileById(clientId: string) {
	const result = await db
		.select({
			profile: { ...clientProfileTable },
			user: {
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
			company: { ...clientCompanyTable }
		})
		.from(clientProfileTable)
		.where(eq(clientProfileTable.id, clientId))
		.innerJoin(userTable, eq(clientProfileTable.userId, userTable.id))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.clientId, clientId));

	return result[0] || null;
}

export async function getClientProfilebyUserId(userId: string | undefined) {
	if (!userId) throw new Error("User ID required")
	const [result] = await db
		.select()
		.from(clientProfileTable)
		.where(eq(clientProfileTable.userId, userId));

	return result || null;
}

export async function getClientIdByCompanyId(companyId: string) {
	try {
		const [company] = await db
			.select({
				clientId: clientCompanyTable.clientId
			})
			.from(clientCompanyTable)
			.where(eq(clientCompanyTable.id, companyId))
			.limit(1);

		if (!company) {
			throw new Error(`No company found with ID: ${companyId}`);
		}

		return company.clientId;
	} catch (err) {
		console.error('Error in getClientIdByCompanyId:', err);
		throw err; // Let the caller handle the error
	}
}

export async function getClientProfileByStaffUserId(userId: string | undefined) {
	if (!userId) return error(400, 'Missing user id')
	const staff = await db
		.select({ clientId: clientStaffProfileTable.clientId })
		.from(clientStaffProfileTable)
		.where(eq(clientStaffProfileTable.userId, userId));
	if (staff.length) {
		const client = await db
			.select()
			.from(clientProfileTable)
			.where(eq(clientProfileTable.id, staff[0].clientId));

		return client.length ? client[0] : null;
	} else return null;
}

export async function getClientCompanyByClientId(clientId: string | undefined) {
	if (!clientId) return error(400, 'Missing client id')
	const [result] = await db
		.select()
		.from(clientCompanyTable)
		.where(eq(clientCompanyTable.clientId, clientId));

	return result;
}
export async function getClientCompanyById(companyId: string | null) {
	if (!companyId) return error(400, 'Must provide company id')
	const [result] = await db
		.select()
		.from(clientCompanyTable)
		.where(eq(clientCompanyTable.id, companyId));

	return result;
}

export async function getClientStaffProfilebyUserId(userId: string) {
	try {
		const [result] = await db
			.select()
			.from(clientStaffProfileTable)
			.where(eq(clientStaffProfileTable.userId, userId));

		return result || null;
	} catch (err) {
		console.log(err)
		return error(500, 'Error fetching client staff profile')
	}
}

export async function getClientStaffProfilebyClientId(clientId: string) {
	const result = await db
		.select()
		.from(clientStaffProfileTable)
		.where(eq(clientStaffProfileTable.clientId, clientId));

	return result[0];
}

export async function getClientStaffProfilesCount(companyId: string) {
	const countResult = await db
		.select({ value: count() })
		.from(clientStaffProfileTable)
		.where(eq(clientStaffProfileTable.companyId, companyId));

	return countResult[0].value;
}
export async function getAllClientStaffProfiles(companyId: string, currentLocationId: string) {
	const results = await db
		.select({
			profile: { ...clientStaffProfileTable },
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
		})
		.from(clientStaffProfileTable)
		.innerJoin(userTable, eq(clientStaffProfileTable.userId, userTable.id))
		.where(
			and(
				eq(clientStaffProfileTable.companyId, companyId),
				notExists(
					db.select()
						.from(clientStaffLocationTable)
						.where(
							and(
								eq(clientStaffLocationTable.staffId, clientStaffProfileTable.id),
								eq(clientStaffLocationTable.locationId, currentLocationId)
							)
						)
				)
			)
		);

	return results;
}

export async function getPaginatedClientStaffProfiles(
	companyId: string,
	{
		limit = 25,
		offset = 0,
		orderBy = undefined
	}: PaginateOptions) {
	const userCols = ['email', 'first_name', 'last_name'];
	const locationCols = ['location_name'];
	const companyCols = ['company_name'];
	const orderSelector = orderBy
		? userCols.includes(orderBy.column)
			? `u.${orderBy.column}`
			: locationCols.includes(orderBy.column)
				? `l.${orderBy.column}`
				: companyCols.includes(orderBy.column)
					? `c.${orderBy.column}`
					: `s.${orderBy.column}`
		: null;

	try {
		const query = sql.empty();

		query.append(sql`
        SELECT
            s.*,
            u.first_name,
            u.last_name,
            u.email,
            u.avatar_url,
            l.location_name,
            sl.is_primary_location,
            c.company_name
        FROM ${clientStaffProfileTable} AS s
        INNER JOIN ${userTable} u ON s.user_id = u.id
        INNER JOIN ${clientCompanyTable} c ON s.company_id = c.id
        LEFT JOIN ${clientStaffLocationTable} sl ON s.id = sl.staff_id
        LEFT JOIN ${companyOfficeLocationTable} l ON sl.location_id = l.id
            AND (sl.is_primary_location = true OR sl.is_primary_location IS NULL)
        WHERE s.company_id = ${companyId}
    `);

		if (orderSelector && orderBy) {
			query.append(sql`
                ORDER BY ${sql.raw(orderSelector)} ${sql.raw(orderBy.direction.toUpperCase())}
            `);
		} else {
			query.append(sql`
                ORDER BY s.created_at DESC
            `);
		}

		query.append(sql`
            LIMIT ${limit}
            OFFSET ${offset}
        `);

		const results = await db.execute(query);

		// Update count to only count unique staff members
		const countResult = await db
			.select({ value: count() })
			.from(clientStaffProfileTable)
			.where(eq(clientStaffProfileTable.companyId, companyId));

		return { staff: results.rows as ClientStaffResults, count: countResult[0].value };
	} catch (err) {
		console.error(err);
		return { staff: [], count: 0 };
	}
}

export async function getClientStaffProfileDetails(staffId: string) {
	const result = await db
		.select({
			staff: { ...clientStaffProfileTable },
			user: {
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
			location: {
				...companyOfficeLocationTable,
				isPrimary: clientStaffLocationTable.isPrimary
			},
			company: {
				...clientCompanyTable
			}
		})
		.from(clientStaffProfileTable)
		.where(eq(clientStaffProfileTable.id, staffId))
		.innerJoin(userTable, eq(clientStaffProfileTable.userId, userTable.id))
		.innerJoin(
			clientStaffLocationTable,
			eq(clientStaffLocationTable.staffId, clientStaffProfileTable.id)
		)
		.innerJoin(
			companyOfficeLocationTable,
			eq(companyOfficeLocationTable.id, clientStaffLocationTable.locationId)
		)
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.id, clientStaffProfileTable.companyId));

	return result[0] || null;
}

export async function getLocationByIdForCompany(locationId: string, companyId: string) {
	const result = await db
		.select()
		.from(companyOfficeLocationTable)
		.where(
			and(
				eq(companyOfficeLocationTable.id, locationId),
				eq(companyOfficeLocationTable.companyId, companyId)
			)
		);

	return result[0] || null;
}

export async function getAllClientLocationsByCompanyId(companyId: string) {
	const results = await db
		.select()
		.from(companyOfficeLocationTable)
		.where(eq(companyOfficeLocationTable.companyId, companyId));

	return results;
}

export async function getPaginatedLocationsByCompanyId(
	companyId: string,
	{
		limit = 25,
		offset = 0,
		orderBy = undefined
	}: PaginateOptions
) {
	const orderSelector = orderBy ? orderBy.column : null;
	try {
		const query = sql.empty();

		query.append(sql`
		SELECT
			l.*
		FROM ${companyOfficeLocationTable} AS l
		WHERE l.company_id = ${companyId}
     `);

		if (orderSelector && orderBy) {
			query.append(sql`
		   ORDER BY ${orderBy.direction === 'asc'
					? sql`${sql.raw(orderSelector)} ASC`
					: sql`${sql.raw(orderSelector)} DESC`
				}
		 `);
		} else {
			query.append(sql`
		   ORDER BY l.created_at DESC
		 `);
		}

		query.append(sql`
       LIMIT ${limit}
       OFFSET ${offset}
     `);

		const results = await db.execute(query);

		const countResult = await db
			.select({ value: count() })
			.from(companyOfficeLocationTable)
			.where(eq(companyOfficeLocationTable.companyId, companyId));

		return { locations: results.rows, count: countResult[0].value };
	} catch (err) {
		console.error(err);
	}
}

export async function getClientStaffLocations(userId: string) { }

export async function getClientSubscription(clientId: string) { }

export async function createCompanyLocation(values: ClientCompanyLocation) {
	const result = await db
		.insert(companyOfficeLocationTable)
		.values(values)
		.onConflictDoNothing()
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

// export async function createCompanyStaffProfile(values: ClientCompanyStaffProfile) { }

export async function getStaffProfilesForLocation(locationId: string) {
	return await db
		.select({
			profile: { ...clientStaffProfileTable },
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			}
		})
		.from(clientStaffProfileTable)
		.innerJoin(userTable, eq(userTable.id, clientStaffProfileTable.userId))
		.innerJoin(
			clientStaffLocationTable,
			and(
				eq(clientStaffLocationTable.staffId, clientStaffProfileTable.id),
				eq(clientStaffLocationTable.locationId, locationId)
			)
		)
		.where(eq(clientStaffLocationTable.locationId, locationId));
}

export async function getLocationsForStaffUser(staffId: string): Promise<StaffLocation[]> {
	try {
		const locations = await db
			.select({
				id: companyOfficeLocationTable.id,
				name: companyOfficeLocationTable.name,
				streetOne: companyOfficeLocationTable.streetOne,
				streetTwo: companyOfficeLocationTable.streetTwo,
				city: companyOfficeLocationTable.city,
				state: companyOfficeLocationTable.state,
				zipcode: companyOfficeLocationTable.zipcode,
				companyPhone: companyOfficeLocationTable.companyPhone,
				cellPhone: companyOfficeLocationTable.cellPhone,
				hoursOfOperation: companyOfficeLocationTable.hoursOfOperation,
				email: companyOfficeLocationTable.email,
				regionId: companyOfficeLocationTable.regionId,
				isPrimary: clientStaffLocationTable.isPrimary,
			})
			.from(clientStaffLocationTable)
			.innerJoin(
				companyOfficeLocationTable,
				eq(clientStaffLocationTable.locationId, companyOfficeLocationTable.id)
			)
			.where(eq(clientStaffLocationTable.staffId, staffId));

		return locations;
	} catch (err) {
		console.log(err)
		error(500, "Error getting locations for staff user")
	}
}

export async function createClientCompany(values: ClientCompany) {
	try {
		const [result] = await db
			.insert(clientCompanyTable)
			.values(values)
			.onConflictDoNothing()
			.returning();

		return result || null
	} catch (err) {
		console.log(err)
		throw error(500, "Error creating company")
	}
}

export async function getCalendarEventsForClient(clientId: string | undefined) {
	if (!clientId) return error(400, "Missing Client Id")
	const clientCompanyResult = await db
		.select({
			client: { ...clientProfileTable },
			company: { ...clientCompanyTable }
		})
		.from(clientProfileTable)
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.clientId, clientProfileTable.id))
		.where(eq(clientProfileTable.id, clientId));

	if (!clientCompanyResult.length) {
		return null;
	}

	const recurrenceDays = await db
		.select({
			recurrenceDay: { ...recurrenceDayTable },
			requisition: { ...requisitionTable, client: { ...clientCompanyTable } }
		})
		.from(recurrenceDayTable)
		.where(
			and(
				eq(requisitionTable.companyId, clientCompanyResult[0].company.id),
				eq(requisitionTable.archived, false)
			)
		)
		.innerJoin(requisitionTable, eq(requisitionTable.id, recurrenceDayTable.requisitionId))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.id, requisitionTable.companyId));

	const recurrenceDayEvents = recurrenceDays.map((recurrenceDay) =>
		convertRecurrenceDayToEvent(recurrenceDay.recurrenceDay, recurrenceDay.requisition)
	);

	return [...recurrenceDayEvents];
}

export async function getRequisitionsForClientWithLimit(clientId: string, count: number) {
	try {
		const company = await getClientCompanyByClientId(clientId)
		const result = await db
			.select()
			.from(requisitionTable)
			.where(and(eq(requisitionTable.companyId, company.id), ne(requisitionTable.status, 'PENDING')))
			.limit(count)
			.orderBy(desc(requisitionTable.createdAt))
		return result
	} catch (err) {
		console.log(err)
		throw error(500, `${err}`)
	}
}

export async function getClientDashboardData(clientId: string | undefined, userId: string | undefined) {
	if (!clientId) throw error(400, 'Client ID required')
	if (!userId) throw error(400, 'User ID required')

	const company = await getClientCompanyByClientId(clientId)

	if (!company) throw error(400, 'No company associated with that client id')

	const [
		requisitions,
		timesheetsDueCount,
		discrepancies,
		newApplicationsCount,
		supportTickets,
		requisitionApplications,
		timesheetsDue
	] = await Promise.all([
		await getRequisitionsForClientWithLimit(clientId, 5),
		await getTimesheetsDueCount(clientId),
		await getClientCompanyTimesheetDiscrepancies(clientId),
		await getNewApplicationsCount(clientId),
		await getSupportTicketsForUserWithLimit(userId, 5),
		await getRecentRequisitionApplications(company.id),
		await getRecentTimesheetsDueForClient(clientId)
	])

	return {
		requisitions,
		timesheetsDueCount,
		timesheetsDue,
		discrepanciesCount: discrepancies.length,
		supportTickets,
		newApplicationsCount,
		positionApplications: requisitionApplications
	}
}

export async function getPrimaryLocationForCompany(companyId: string) {
	try {
		const [result] = await db
			.select()
			.from(companyOfficeLocationTable)
			.where(eq(companyOfficeLocationTable.companyId, companyId))
			.orderBy(desc(companyOfficeLocationTable.createdAt))
			.limit(1)

		return result
	} catch (err) {
		console.log(err)
		return error(500, 'Error getting primary location for company')
	}
}

export async function addStaffToLocation(values: NewClientCompanyStaffLocation) {
	try {
		const [result] = await db
			.insert(clientStaffLocationTable)
			.values(values)
			.onConflictDoNothing()
			.returning()

		return result
	} catch (err) {
		console.log(err)
		return error(500, 'Error adding staff to location')
	}
}

export async function inviteStaffUsersToAccount(locationId: string, invitees: NewUserInvite[]) {
	const [location] = await db
		.select()
		.from(companyOfficeLocationTable)
		.where(eq(companyOfficeLocationTable.id, locationId));

	if (!location) {
		throw new Error('Location not found');
	}

	// Get company name for the email
	const [company] = await db
		.select({
			name: clientCompanyTable.companyName
		})
		.from(clientCompanyTable)
		.where(eq(clientCompanyTable.id, location.companyId));

	if (!company) {
		throw new Error('Company not found');
	}

	const inviteResults = await Promise.all(
		invitees.map(async (invitee) => {
			const token = crypto.randomUUID();

			try {
				// Begin transaction
				return await db.transaction(async (tx) => {
					// Create the user invite
					const [invite] = await tx
						.insert(userInviteTable)
						.values({
							id: crypto.randomUUID(),
							token,
							email: invitee.email.toLowerCase(),
							expiresAt: invitee.expiresAt,
							referrerRole: invitee.referrerRole,
							referrerId: invitee.referrerId,
							invitedRole: invitee.invitedRole,
							staffRole: invitee.staffRole,
							companyId: location.companyId
						})
						.returning();

					// Create the location association
					await tx.insert(companyStaffInviteLocations).values({
						token,
						locationId,
						isPrimary: true
					});

					// Send the invite email
					try {
						await sendClientStaffInviteEmail(
							invitee.email,
							token,
							company.name || "unknown company"
						);

						return {
							success: true,
							invite,
							email: invitee.email,
							emailSent: true
						};
					} catch (emailError) {
						console.error('Error sending invite email:', emailError);
						return {
							success: true,
							invite,
							email: invitee.email,
							emailSent: false,
							emailError: emailError instanceof Error ? emailError.message : 'Failed to send email'
						};
					}
				});
			} catch (error) {
				console.error('Error creating invite:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
					email: invitee.email,
					emailSent: false
				};
			}
		})
	);

	// Check if any invites failed to create
	const dbFailures = inviteResults.filter(result => !result.success);
	if (dbFailures.length > 0) {
		throw new Error(`Failed to create invites for: ${dbFailures.map(f => f.email).join(', ')}`);
	}

	// Log any email sending failures
	const emailFailures = inviteResults.filter(result => result.success && !result.emailSent);
	if (emailFailures.length > 0) {
		console.warn(`Failed to send emails for: ${emailFailures.map(f => f.email).join(', ')}`);
	}

	return inviteResults;
}