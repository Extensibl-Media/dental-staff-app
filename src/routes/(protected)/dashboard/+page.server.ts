import { USER_ROLES } from '$lib/config/constants.js';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import {
	getClientDashboardData,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getClientStaffProfilebyUserId
} from '$lib/server/database/queries/clients';
import { newSupportTicketSchema } from '$lib/config/zod-schemas';
import { superValidate } from 'sveltekit-superforms/server';

export const load = async (event: RequestEvent) => {
	//I only have this function here so it will check page again
	//instead of keeping it cache if it was client side only.
	//If only client side, it might still show the page even
	//if the user has logged out.
	// const session = await locals.auth.validate();
	event.setHeaders({
		'cache-control': 'max-age=60'
	});

	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === 'SUPERADMIN') {
		// Dummy data object that matches the expected structure for the admin dashboard
		const adminDashboardData = {
			// Stats for the top cards
			timesheetsDueCount: 24,
			supportTicketsCount: 15,
			discrepanciesCount: 8,

			// Notifications for the top-right menu
			notifications: [
				{ id: 1, title: 'New support ticket', read: false },
				{ id: 2, title: 'Timesheet discrepancy', read: false },
				{ id: 3, title: 'New client signup', read: true },
				{ id: 4, title: 'Candidate profile submitted', read: false },
				{ id: 5, title: 'System maintenance', read: true }
			],

			// Recent messages data
			recentMessages: [
				{
					id: 1,
					sender: { firstName: 'John', lastName: 'Smith', id: 101 },
					subject: 'Question about invoice',
					createdAt: new Date(2025, 3, 22, 14, 30),
					read: false
				},
				{
					id: 2,
					sender: { firstName: 'Lisa', lastName: 'Johnson', id: 102 },
					subject: 'Timesheet approval request',
					createdAt: new Date(2025, 3, 22, 10, 15),
					read: true
				},
				{
					id: 3,
					sender: { firstName: 'Michael', lastName: 'Chen', id: 103 },
					subject: 'New position inquiry',
					createdAt: new Date(2025, 3, 21, 16, 45),
					read: false
				},
				{
					id: 4,
					sender: { firstName: 'Sarah', lastName: 'Williams', id: 104 },
					subject: 'System feedback',
					createdAt: new Date(2025, 3, 21, 9, 20),
					read: true
				},
				{
					id: 5,
					sender: { firstName: 'David', lastName: 'Miller', id: 105 },
					subject: 'Contract question',
					createdAt: new Date(2025, 3, 20, 13, 10),
					read: false
				}
			],

			// Timesheets with discrepancies
			timesheetsWithDiscrepancies: [
				{
					id: 201,
					requisition: { title: 'Senior Developer', id: 301 },
					candidate: { firstName: 'Robert', lastName: 'Jones', id: 401 },
					weekBeginDate: '2025-04-14',
					totalHoursWorked: 43.5,
					discrepancyCount: 2
				},
				{
					id: 202,
					requisition: { title: 'Project Manager', id: 302 },
					candidate: { firstName: 'Emily', lastName: 'Davis', id: 402 },
					weekBeginDate: '2025-04-14',
					totalHoursWorked: 38.5,
					discrepancyCount: 1
				},
				{
					id: 203,
					requisition: { title: 'Data Analyst', id: 303 },
					candidate: { firstName: 'Thomas', lastName: 'Brown', id: 403 },
					weekBeginDate: '2025-04-14',
					totalHoursWorked: 40.0,
					discrepancyCount: 3
				},
				{
					id: 204,
					requisition: { title: 'UI Designer', id: 304 },
					candidate: { firstName: 'Jessica', lastName: 'Martinez', id: 404 },
					weekBeginDate: '2025-04-07',
					totalHoursWorked: 35.5,
					discrepancyCount: 1
				},
				{
					id: 205,
					requisition: { title: 'DevOps Engineer', id: 305 },
					candidate: { firstName: 'Kevin', lastName: 'Wilson', id: 405 },
					weekBeginDate: '2025-04-07',
					totalHoursWorked: 42.0,
					discrepancyCount: 1
				}
			],

			// Support tickets
			supportTickets: [
				{
					id: 501,
					title: 'Cannot access timesheet portal',
					user: { firstName: 'Amanda', lastName: 'Taylor', id: 601 },
					status: 'NEW',
					createdAt: new Date(2025, 3, 22, 16, 30)
				},
				{
					id: 502,
					title: 'Error when submitting invoice',
					user: { firstName: 'Christopher', lastName: 'Anderson', id: 602 },
					status: 'PENDING',
					createdAt: new Date(2025, 3, 22, 11, 45)
				},
				{
					id: 503,
					title: 'Need to update company info',
					user: { firstName: 'Jennifer', lastName: 'Thomas', id: 603 },
					status: 'NEW',
					createdAt: new Date(2025, 3, 21, 15, 20)
				},
				{
					id: 504,
					title: 'Discrepancy in hours calculation',
					user: { firstName: 'Matthew', lastName: 'Garcia', id: 604 },
					status: 'PENDING',
					createdAt: new Date(2025, 3, 21, 10, 10)
				},
				{
					id: 505,
					title: 'Password reset not working',
					user: { firstName: 'Elizabeth', lastName: 'Lee', id: 605 },
					status: 'CLOSED',
					createdAt: new Date(2025, 3, 20, 14, 40)
				}
			],

			// New candidate profiles
			newCandidateProfiles: [
				{
					id: 701,
					firstName: 'Daniel',
					lastName: 'Clark',
					desiredPosition: 'Full Stack Developer',
					createdAt: new Date(2025, 3, 22, 17, 30)
				},
				{
					id: 702,
					firstName: 'Olivia',
					lastName: 'Rodriguez',
					desiredPosition: 'Product Manager',
					createdAt: new Date(2025, 3, 22, 13, 15)
				},
				{
					id: 703,
					firstName: 'James',
					lastName: 'White',
					desiredPosition: 'Data Scientist',
					createdAt: new Date(2025, 3, 21, 16, 40)
				},
				{
					id: 704,
					firstName: 'Sophia',
					lastName: 'Martin',
					desiredPosition: 'UX Designer',
					createdAt: new Date(2025, 3, 21, 11, 20)
				},
				{
					id: 705,
					firstName: 'Benjamin',
					lastName: 'Harris',
					desiredPosition: 'Network Engineer',
					createdAt: new Date(2025, 3, 20, 15, 45)
				}
			],

			// New client signups
			newClientSignups: [
				{
					id: 801,
					companyName: 'Quantum Solutions',
					contactFirstName: 'Richard',
					contactLastName: 'Allen',
					status: 'PENDING',
					createdAt: new Date(2025, 3, 22, 15, 30)
				},
				{
					id: 802,
					companyName: 'Insight Analytics',
					contactFirstName: 'Patricia',
					contactLastName: 'Young',
					status: 'ACTIVE',
					createdAt: new Date(2025, 3, 22, 11, 10)
				},
				{
					id: 803,
					companyName: 'TechNova Inc.',
					contactFirstName: 'William',
					contactLastName: 'King',
					status: 'PENDING',
					createdAt: new Date(2025, 3, 21, 14, 25)
				},
				{
					id: 804,
					companyName: 'Pinnacle Consulting',
					contactFirstName: 'Nancy',
					contactLastName: 'Wright',
					status: 'ACTIVE',
					createdAt: new Date(2025, 3, 21, 9, 50)
				},
				{
					id: 805,
					companyName: 'EcoSystems Group',
					contactFirstName: 'Steven',
					contactLastName: 'Scott',
					status: 'INACTIVE',
					createdAt: new Date(2025, 3, 20, 16, 15)
				}
			]
		};
		return { user, ...adminDashboardData };
	}

	if (user.role === USER_ROLES.CLIENT) {
		const supportTicketForm = await superValidate(event, newSupportTicketSchema);

		if (!user.completedOnboarding) {
			redirect(302, '/onboarding/client/company');
		}

		const client = await getClientProfilebyUserId(user.id);
		const {
			requisitions,
			supportTickets,
			newApplicationsCount,
			timesheetsDueCount,
			discrepanciesCount,
			positionApplications,
			timesheetsDue
		} = await getClientDashboardData(client?.id, user.id);

		return {
			user,
			profile: client,
			client,
			requisitions,
			recentApplications: positionApplications,
			supportTickets,
			newApplicationsCount,
			timesheetsDue,
			timesheetsDueCount,
			discrepanciesCount,
			supportTicketForm
		};
	}

	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		const profile = await getClientStaffProfilebyUserId(user.id);
		const supportTicketForm = await superValidate(event, newSupportTicketSchema);

		const {
			requisitions,
			supportTickets,
			newApplicationsCount,
			timesheetsDueCount,
			discrepanciesCount,
			positionApplications,
			timesheetsDue
		} = await getClientDashboardData(client?.id, user.id);

		return {
			user,
			profile,
			client,
			requisitions,
			recentApplications: positionApplications,
			supportTickets,
			newApplicationsCount,
			timesheetsDue,
			timesheetsDueCount,
			discrepanciesCount,
			supportTicketForm
		};
	}

	return null;
};
