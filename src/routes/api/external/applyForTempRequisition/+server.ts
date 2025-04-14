import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database/drizzle';
import {
	candidateDisciplineExperienceTable,
	candidateProfileTable
} from '$lib/server/database/schemas/candidate';
import {
	requisitionTable,
	workdayTable,
	recurrenceDayTable
} from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const corsHeaders = {
	'Access-Control-Allow-Origin': env.CANDIDATE_APP_DOMAIN,
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Allow-Credentials': 'true'
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		headers: corsHeaders
	});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validate content type
		const contentType = request.headers.get('content-type');
		if (!contentType?.includes('application/json')) {
			return json(
				{ success: false, message: 'Content-Type must be application/json' },
				{ status: 400, headers: corsHeaders }
			);
		}

		// Authenticate user
		const user = await authenticateUser(request);
		// console.log('User attempting to claim shift:', { userId: user.id });
		if (!user) {
			return json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401, headers: corsHeaders }
			);
		}

		// Validate request body
		const body = await request.json().catch(() => null);
		if (!body) {
			return json(
				{ success: false, message: 'Invalid request body' },
				{ status: 400, headers: corsHeaders }
			);
		}

		const { recurrenceDayId } = body;

		return await db.transaction(async (tx) => {
			// Get candidate profile
			const candidateProfile = await tx
				.select()
				.from(candidateProfileTable)
				.where(eq(candidateProfileTable.userId, user.id))
				.limit(1)
				.then((rows) => rows[0]);

			console.log('Candidate profile found:', {
				candidateId: candidateProfile.id,
				userId: user.id
			});

			if (!candidateProfile) {
				return json(
					{ success: false, message: 'Candidate profile not found' },
					{ status: 404, headers: corsHeaders }
				);
			}

			// Verify requisition exists and is active
			const [recurrenceDay] = await tx
				.select({
					requisition: { ...requisitionTable },
					recurrenceDay: { ...recurrenceDayTable }
				})
				.from(recurrenceDayTable)
				.innerJoin(requisitionTable, eq(recurrenceDayTable.requisitionId, requisitionTable.id))
				.where(and(eq(recurrenceDayTable.id, recurrenceDayId), eq(requisitionTable.status, 'OPEN')))
				.limit(1);

			console.log('Recurrence day details:', {
				recurrenceDayId,
				requisitionId: recurrenceDay.requisition.id,
				status: recurrenceDay.requisition.status,
				disciplineId: recurrenceDay.requisition.disciplineId
			});

			if (!recurrenceDay) {
				return json(
					{ success: false, message: 'Requisition not found or not active' },
					{ status: 404, headers: corsHeaders }
				);
			}

			// const clientId = await getClientIdByCompanyId(recurrenceDay.requisition.companyId);

			// TODO CHeck if workday exists for this candidate and this recurrence day/requisition
			const [existingWorkday] = await db
				.select()
				.from(workdayTable)
				.where(
					and(
						eq(workdayTable.requisitionId, recurrenceDay.requisition.id),
						eq(workdayTable.recurrenceDayId, recurrenceDayId),
						eq(workdayTable.candidateId, candidateProfile.id)
					)
				)
				.limit(1);

			if (existingWorkday) {
				return json(
					{ success: false, message: 'You have already applied for this requisition workday' },
					{ status: 409, headers: corsHeaders }
				);
			}

			const disciplines = await db
				.select()
				.from(candidateDisciplineExperienceTable)
				.where(eq(candidateDisciplineExperienceTable.candidateId, candidateProfile.id));

			console.log('Candidate discipline check:', {
				candidateId: candidateProfile.id,
				requiredDisciplineId: recurrenceDay.requisition.disciplineId,
				candidateDisciplines: disciplines.map((d) => d.disciplineId),
				isQualified: disciplines.some(
					(disc) => disc.disciplineId === recurrenceDay.requisition.disciplineId
				)
			});

			// Check if Candidate is qualified for this workday
			if (
				!disciplines.some((disc) => disc.disciplineId === recurrenceDay.requisition.disciplineId)
			) {
				return json(
					{
						success: false,
						message: 'You do not have the required discipline experience for this position'
					},
					{ status: 403, headers: corsHeaders }
				);
			}

			// Create a Workday for this temp requisition for this recurrence day
			const [newWorkday] = await db
				.insert(workdayTable)
				.values({
					id: crypto.randomUUID(),
					createdAt: new Date(),
					updatedAt: new Date(),
					candidateId: candidateProfile.id,
					requisitionId: recurrenceDay.requisition.id,
					recurrenceDayId
				})
				.returning();

			console.log('New workday created:', {
				workdayId: newWorkday.id,
				candidateId: candidateProfile.id,
				requisitionId: recurrenceDay.requisition.id,
				recurrenceDayId
			});

			// Change Status of the recurrence day
			const [updatedRecurrenceDay] = await db
				.update(recurrenceDayTable)
				.set({ status: 'FILLED' })
				.where(eq(recurrenceDayTable.id, recurrenceDayId))
				.returning();

			console.log('Updated recurrence day status:', {
				recurrenceDayId,
				newStatus: 'FILLED',
				success: !!updatedRecurrenceDay
			});

			// TODO Update any relevant data for the candidate
			// TODO Notify the client of a claimed workday

			return json(
				{
					success: true,
					data: {
						workday: {
							id: newWorkday.id,
							createdAt: newWorkday.createdAt
						}
					}
				},
				{ headers: corsHeaders }
			);
		});
	} catch (err) {
		console.error('Error in POST /api/external/applyForTempRequisition:', err);
		// Determine if error is known/expected
		if (err instanceof Error && 'status' in err && 'body' in err) {
			return json(
				{ success: false, message: (err as any).body.message },
				{
					status: (err as any).status,
					headers: corsHeaders
				}
			);
		}

		// Unknown error
		return json(
			{ success: false, message: 'Internal server error' },
			{
				status: 500,
				headers: corsHeaders
			}
		);
	}
};
