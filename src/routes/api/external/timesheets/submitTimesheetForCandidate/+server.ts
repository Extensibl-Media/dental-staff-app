import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import { timeSheetTable } from '$lib/server/database/schemas/requisition';
import { requisitionTable } from '$lib/server/database/schemas/requisition';
import { workdayTable } from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getClientIdByCompanyId } from '$lib/server/database/queries/clients';

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
    if (!user) {
      return json(
        { success: false, message: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate request body
    const body = await request.json().catch(() => null);
    if (!body ||
      typeof body.workdayId !== 'string' ||
      typeof body.requisitionId !== 'number' ||
      typeof body.recurrenceDayId !== 'string' ||
      typeof body.weekBeginDate !== 'string' ||
      !Array.isArray(body.hoursRaw) ||
      typeof body.totalHoursWorked !== 'number' ||
      typeof body.candidateRateBase !== 'number' ||
      typeof body.candidateRateOT !== 'number') {
      return json(
        { success: false, message: 'Invalid request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const {
      workdayId,
      requisitionId,
      recurrenceDayId,
      weekBeginDate,
      hoursRaw,
      totalHoursWorked,
      candidateRateBase,
      candidateRateOT
    } = body;

    return await db.transaction(async (tx) => {
      // Get candidate profile
      const candidateProfile = await tx
        .select()
        .from(candidateProfileTable)
        .where(eq(candidateProfileTable.userId, user.id))
        .limit(1)
        .then((rows) => rows[0]);

      if (!candidateProfile) {
        return json(
          { success: false, message: 'Candidate profile not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Verify requisition exists
      const requisition = await tx
        .select()
        .from(requisitionTable)
        .where(eq(requisitionTable.id, requisitionId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!requisition) {
        return json(
          { success: false, message: 'Requisition not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Verify workday exists
      const workday = await tx
        .select()
        .from(workdayTable)
        .where(eq(workdayTable.id, workdayId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!workday) {
        return json(
          { success: false, message: 'Workday not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      const clientId = await getClientIdByCompanyId(requisition.companyId);

      // Check for existing timesheet
      const existingTimesheet = await tx
        .select()
        .from(timeSheetTable)
        .where(
          and(
            eq(timeSheetTable.workdayId, workdayId),
            eq(timeSheetTable.associatedCandidateId, candidateProfile.id),
            eq(timeSheetTable.requisitionId, requisitionId)
          )
        )
        .limit(1)
        .then((rows) => rows[0]);

      if (existingTimesheet) {
        return json(
          { success: false, message: 'Timesheet already exists for this workday' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Create timesheet with all required fields
      const [timesheet] = await tx
        .insert(timeSheetTable)
        .values({
          id: crypto.randomUUID(),
          workdayId,
          requisitionId,
          recurrenceDayId,
          associatedClientId: clientId,
          associatedCandidateId: candidateProfile.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          validated: false,
          totalHoursWorked,
          awaitingClientSignature: true,
          candidateRateBase,
          candidateRateOT,
          weekBeginDate: new Date(weekBeginDate),
          hoursRaw
        })
        .returning();

      console.log(`New timesheet created: ${timesheet.id} for workday: ${workdayId}`);

      return json(
        {
          success: true,
          data: {
            timesheet: {
              id: timesheet.id,
              totalHoursWorked: timesheet.totalHoursWorked,
              totalHoursBilled: timesheet.totalHoursBilled,
              validated: timesheet.validated,
              awaitingClientSignature: timesheet.awaitingClientSignature,
              createdAt: timesheet.createdAt
            }
          }
        },
        { headers: corsHeaders }
      );
    });
  } catch (err) {
    console.error('Error in POST /api/external/timesheets/submitTimesheetForCandidate:', err);
    if (err instanceof Error && 'status' in err && 'body' in err) {
      return json(
        { success: false, message: (err as any).body.message },
        {
          status: (err as any).status,
          headers: corsHeaders
        }
      );
    }

    return json(
      { success: false, message: 'Internal server error' },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};
