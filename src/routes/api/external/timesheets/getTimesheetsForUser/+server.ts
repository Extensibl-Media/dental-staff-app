import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import { clientCompanyTable } from '$lib/server/database/schemas/client';
import {
  timeSheetTable,
  requisitionTable,
  workdayTable,
  recurrenceDayTable
} from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  console.log('Handler: getTimesheetsForUser')
  // Authenticate the user
  const user = await authenticateUser(request);
  console.log(user)

  try {
    // Get the candidate's profile
    const [candidateProfile] = await db
      .select()
      .from(candidateProfileTable)
      .where(eq(candidateProfileTable.userId, user.id))
      .limit(1);

    if (!candidateProfile) {
      throw error(404, 'Candidate profile not found');
    }

    // Fetch timesheets with related data
    const timesheets = await db
      .select({
        timesheet: {
          id: timeSheetTable.id,
          createdAt: timeSheetTable.createdAt,
          updatedAt: timeSheetTable.updatedAt,
          validated: timeSheetTable.validated,
          totalHoursWorked: timeSheetTable.totalHoursWorked,
          totalHoursBilled: timeSheetTable.totalHoursBilled,
          awaitingClientSignature: timeSheetTable.awaitingClientSignature,
          weekBeginDate: timeSheetTable.weekBeginDate,
          hoursRaw: timeSheetTable.hoursRaw
        },
        requisition: {
          id: requisitionTable.id,
          title: requisitionTable.title,
          status: requisitionTable.status
        },
        company: {
          id: clientCompanyTable.id,
          name: clientCompanyTable.companyName,
          logo: clientCompanyTable.companyLogo
        },
        workday: {
          id: workdayTable.id
        },
        recurrenceDay: {
          id: recurrenceDayTable.id,
          date: recurrenceDayTable.date,
          dayStartTime: recurrenceDayTable.dayStartTime,
          dayEndTime: recurrenceDayTable.dayEndTime
        }
      })
      .from(timeSheetTable)
      .leftJoin(
        requisitionTable,
        eq(timeSheetTable.requisitionId, requisitionTable.id)
      )
      .leftJoin(
        workdayTable,
        eq(timeSheetTable.workdayId, workdayTable.id)
      )
      .leftJoin(
        recurrenceDayTable,
        eq(timeSheetTable.recurrenceDayId, recurrenceDayTable.id)
      )
      .innerJoin(
        clientCompanyTable,
        eq(requisitionTable.companyId, clientCompanyTable.id)
      )
      .where(
        and(
          eq(timeSheetTable.associatedCandidateId, candidateProfile.id)
        )
      )
      // Order by most recent first
      .orderBy(timeSheetTable.weekBeginDate);

    console.log({ timesheets })

    return json(timesheets);
  } catch (err) {
    console.error('Error fetching timesheets:', err);
    throw error(500, 'Internal server error');
  }
};