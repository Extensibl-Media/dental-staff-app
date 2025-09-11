import { relations } from "drizzle-orm/relations";
import { users, sessions, client_profiles, client_companies, admin_notes, support_tickets, candidate_profiles, candidate_ratings, client_ratings, client_staff_locations, client_staff, company_office_locations, skill_categories, skills, admin_note_comments, client_subscriptions, support_ticket_comments, requisition_application, requisitions, disciplines, experience_levels, candidate_document_uploads, in_app_notifications, action_history, recurrence_days, timesheets, workdays, invoices, conversations, messages, candidate_blacklists, candidate_saved_requisitions, candidate_discipline_experience, conversation_participants } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.user_id],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	admin_notes_for_user_id: many(admin_notes, {
		relationName: "admin_notes_for_user_id_users_id"
	}),
	admin_notes_created_by_id: many(admin_notes, {
		relationName: "admin_notes_created_by_id_users_id"
	}),
	support_tickets_reported_by: many(support_tickets, {
		relationName: "support_tickets_reported_by_users_id"
	}),
	support_tickets_closed_by_id: many(support_tickets, {
		relationName: "support_tickets_closed_by_id_users_id"
	}),
	candidate_profiles: many(candidate_profiles),
	client_profiles: many(client_profiles),
	client_staffs: many(client_staff),
	admin_note_comments: many(admin_note_comments),
	support_ticket_comments: many(support_ticket_comments),
	in_app_notifications: many(in_app_notifications),
	action_histories: many(action_history),
	messages: many(messages),
	conversation_participants: many(conversation_participants),
}));

export const client_companiesRelations = relations(client_companies, ({one, many}) => ({
	client_profile: one(client_profiles, {
		fields: [client_companies.client_id],
		references: [client_profiles.id]
	}),
	candidate_ratings: many(candidate_ratings),
	client_ratings: many(client_ratings),
	client_staff_locations: many(client_staff_locations),
	client_staffs: many(client_staff),
	company_office_locations: many(company_office_locations),
	requisitions: many(requisitions),
	candidate_blacklists: many(candidate_blacklists),
}));

export const client_profilesRelations = relations(client_profiles, ({one, many}) => ({
	client_companies: many(client_companies),
	user: one(users, {
		fields: [client_profiles.user_id],
		references: [users.id]
	}),
	client_staffs: many(client_staff),
	client_subscriptions: many(client_subscriptions),
	requisition_applications: many(requisition_application),
	timesheets: many(timesheets),
	invoices: many(invoices),
}));

export const admin_notesRelations = relations(admin_notes, ({one, many}) => ({
	user_for_user_id: one(users, {
		fields: [admin_notes.for_user_id],
		references: [users.id],
		relationName: "admin_notes_for_user_id_users_id"
	}),
	user_created_by_id: one(users, {
		fields: [admin_notes.created_by_id],
		references: [users.id],
		relationName: "admin_notes_created_by_id_users_id"
	}),
	admin_note_comments: many(admin_note_comments),
}));

export const support_ticketsRelations = relations(support_tickets, ({one, many}) => ({
	user_reported_by: one(users, {
		fields: [support_tickets.reported_by],
		references: [users.id],
		relationName: "support_tickets_reported_by_users_id"
	}),
	user_closed_by_id: one(users, {
		fields: [support_tickets.closed_by_id],
		references: [users.id],
		relationName: "support_tickets_closed_by_id_users_id"
	}),
	support_ticket_comments: many(support_ticket_comments),
}));

export const candidate_profilesRelations = relations(candidate_profiles, ({one, many}) => ({
	user: one(users, {
		fields: [candidate_profiles.user_id],
		references: [users.id]
	}),
	candidate_ratings: many(candidate_ratings),
	client_ratings: many(client_ratings),
	requisition_applications: many(requisition_application),
	candidate_document_uploads: many(candidate_document_uploads),
	timesheets: many(timesheets),
	workdays: many(workdays),
	invoices: many(invoices),
	candidate_blacklists: many(candidate_blacklists),
	candidate_saved_requisitions: many(candidate_saved_requisitions),
	candidate_discipline_experiences: many(candidate_discipline_experience),
}));

export const candidate_ratingsRelations = relations(candidate_ratings, ({one}) => ({
	client_company: one(client_companies, {
		fields: [candidate_ratings.rated_by_id],
		references: [client_companies.id]
	}),
	candidate_profile: one(candidate_profiles, {
		fields: [candidate_ratings.candidate_id],
		references: [candidate_profiles.id]
	}),
}));

export const client_ratingsRelations = relations(client_ratings, ({one}) => ({
	candidate_profile: one(candidate_profiles, {
		fields: [client_ratings.rated_by_id],
		references: [candidate_profiles.id]
	}),
	client_company: one(client_companies, {
		fields: [client_ratings.client_company_id],
		references: [client_companies.id]
	}),
}));

export const client_staff_locationsRelations = relations(client_staff_locations, ({one}) => ({
	client_company: one(client_companies, {
		fields: [client_staff_locations.company_id],
		references: [client_companies.id]
	}),
	client_staff: one(client_staff, {
		fields: [client_staff_locations.staff_id],
		references: [client_staff.id]
	}),
	company_office_location: one(company_office_locations, {
		fields: [client_staff_locations.location_id],
		references: [company_office_locations.id]
	}),
}));

export const client_staffRelations = relations(client_staff, ({one, many}) => ({
	client_staff_locations: many(client_staff_locations),
	client_company: one(client_companies, {
		fields: [client_staff.company_id],
		references: [client_companies.id]
	}),
	client_profile: one(client_profiles, {
		fields: [client_staff.client_id],
		references: [client_profiles.id]
	}),
	user: one(users, {
		fields: [client_staff.user_id],
		references: [users.id]
	}),
}));

export const company_office_locationsRelations = relations(company_office_locations, ({one, many}) => ({
	client_staff_locations: many(client_staff_locations),
	client_company: one(client_companies, {
		fields: [company_office_locations.company_id],
		references: [client_companies.id]
	}),
	requisitions: many(requisitions),
}));

export const skillsRelations = relations(skills, ({one}) => ({
	skill_category: one(skill_categories, {
		fields: [skills.category_id],
		references: [skill_categories.id]
	}),
}));

export const skill_categoriesRelations = relations(skill_categories, ({many}) => ({
	skills: many(skills),
}));

export const admin_note_commentsRelations = relations(admin_note_comments, ({one}) => ({
	user: one(users, {
		fields: [admin_note_comments.created_by_id],
		references: [users.id]
	}),
	admin_note: one(admin_notes, {
		fields: [admin_note_comments.admin_note_id],
		references: [admin_notes.id]
	}),
}));

export const client_subscriptionsRelations = relations(client_subscriptions, ({one}) => ({
	client_profile: one(client_profiles, {
		fields: [client_subscriptions.client_id],
		references: [client_profiles.id]
	}),
}));

export const support_ticket_commentsRelations = relations(support_ticket_comments, ({one}) => ({
	support_ticket: one(support_tickets, {
		fields: [support_ticket_comments.support_ticket_id],
		references: [support_tickets.id]
	}),
	user: one(users, {
		fields: [support_ticket_comments.from_id],
		references: [users.id]
	}),
}));

export const requisition_applicationRelations = relations(requisition_application, ({one, many}) => ({
	candidate_profile: one(candidate_profiles, {
		fields: [requisition_application.candidate_id],
		references: [candidate_profiles.id]
	}),
	requisition: one(requisitions, {
		fields: [requisition_application.requisition_id],
		references: [requisitions.id]
	}),
	client_profile: one(client_profiles, {
		fields: [requisition_application.client_id],
		references: [client_profiles.id]
	}),
	conversations: many(conversations),
}));

export const requisitionsRelations = relations(requisitions, ({one, many}) => ({
	requisition_applications: many(requisition_application),
	client_company: one(client_companies, {
		fields: [requisitions.client_id],
		references: [client_companies.id]
	}),
	company_office_location: one(company_office_locations, {
		fields: [requisitions.location_id],
		references: [company_office_locations.id]
	}),
	discipline: one(disciplines, {
		fields: [requisitions.discipline_id],
		references: [disciplines.id]
	}),
	experience_level: one(experience_levels, {
		fields: [requisitions.experience_level_id],
		references: [experience_levels.id]
	}),
	recurrence_days: many(recurrence_days),
	timesheets: many(timesheets),
	workdays: many(workdays),
	invoices: many(invoices),
	candidate_saved_requisitions: many(candidate_saved_requisitions),
}));

export const disciplinesRelations = relations(disciplines, ({many}) => ({
	requisitions: many(requisitions),
	candidate_discipline_experiences: many(candidate_discipline_experience),
}));

export const experience_levelsRelations = relations(experience_levels, ({many}) => ({
	requisitions: many(requisitions),
	candidate_discipline_experiences: many(candidate_discipline_experience),
}));

export const candidate_document_uploadsRelations = relations(candidate_document_uploads, ({one}) => ({
	candidate_profile: one(candidate_profiles, {
		fields: [candidate_document_uploads.candidate_id],
		references: [candidate_profiles.id]
	}),
}));

export const in_app_notificationsRelations = relations(in_app_notifications, ({one}) => ({
	user: one(users, {
		fields: [in_app_notifications.user_id],
		references: [users.id]
	}),
}));

export const action_historyRelations = relations(action_history, ({one}) => ({
	user: one(users, {
		fields: [action_history.user_id],
		references: [users.id]
	}),
}));

export const recurrence_daysRelations = relations(recurrence_days, ({one, many}) => ({
	requisition: one(requisitions, {
		fields: [recurrence_days.requisition_id],
		references: [requisitions.id]
	}),
	workdays: many(workdays),
}));

export const timesheetsRelations = relations(timesheets, ({one, many}) => ({
	client_profile: one(client_profiles, {
		fields: [timesheets.associated_client_id],
		references: [client_profiles.id]
	}),
	candidate_profile: one(candidate_profiles, {
		fields: [timesheets.associated_candidate_id],
		references: [candidate_profiles.id]
	}),
	requisition: one(requisitions, {
		fields: [timesheets.requisition_id],
		references: [requisitions.id]
	}),
	workday: one(workdays, {
		fields: [timesheets.workday_id],
		references: [workdays.id]
	}),
	invoices: many(invoices),
}));

export const workdaysRelations = relations(workdays, ({one, many}) => ({
	timesheets: many(timesheets),
	candidate_profile: one(candidate_profiles, {
		fields: [workdays.candidate_id],
		references: [candidate_profiles.id]
	}),
	requisition: one(requisitions, {
		fields: [workdays.requisition_id],
		references: [requisitions.id]
	}),
	recurrence_day: one(recurrence_days, {
		fields: [workdays.recurrence_day_id],
		references: [recurrence_days.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
	requisition: one(requisitions, {
		fields: [invoices.requisition_id],
		references: [requisitions.id]
	}),
	client_profile: one(client_profiles, {
		fields: [invoices.client_id],
		references: [client_profiles.id]
	}),
	candidate_profile: one(candidate_profiles, {
		fields: [invoices.candidate_id],
		references: [candidate_profiles.id]
	}),
	timesheet: one(timesheets, {
		fields: [invoices.timesheet_id],
		references: [timesheets.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	requisition_application: one(requisition_application, {
		fields: [conversations.application_id],
		references: [requisition_application.id]
	}),
	messages: many(messages),
	conversation_participants: many(conversation_participants),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	conversation: one(conversations, {
		fields: [messages.conversation_id],
		references: [conversations.id]
	}),
	user: one(users, {
		fields: [messages.sender_id],
		references: [users.id]
	}),
	conversation_participants: many(conversation_participants),
}));

export const candidate_blacklistsRelations = relations(candidate_blacklists, ({one}) => ({
	candidate_profile: one(candidate_profiles, {
		fields: [candidate_blacklists.candidate_id],
		references: [candidate_profiles.id]
	}),
	client_company: one(client_companies, {
		fields: [candidate_blacklists.company_id],
		references: [client_companies.id]
	}),
}));

export const candidate_saved_requisitionsRelations = relations(candidate_saved_requisitions, ({one}) => ({
	requisition: one(requisitions, {
		fields: [candidate_saved_requisitions.requisition_id],
		references: [requisitions.id]
	}),
	candidate_profile: one(candidate_profiles, {
		fields: [candidate_saved_requisitions.candidate_id],
		references: [candidate_profiles.id]
	}),
}));

export const candidate_discipline_experienceRelations = relations(candidate_discipline_experience, ({one}) => ({
	discipline: one(disciplines, {
		fields: [candidate_discipline_experience.discipline_id],
		references: [disciplines.id]
	}),
	candidate_profile: one(candidate_profiles, {
		fields: [candidate_discipline_experience.candidate_id],
		references: [candidate_profiles.id]
	}),
	experience_level: one(experience_levels, {
		fields: [candidate_discipline_experience.experience_level_id],
		references: [experience_levels.id]
	}),
}));

export const conversation_participantsRelations = relations(conversation_participants, ({one}) => ({
	user: one(users, {
		fields: [conversation_participants.user_id],
		references: [users.id]
	}),
	conversation: one(conversations, {
		fields: [conversation_participants.conversation_id],
		references: [conversations.id]
	}),
	message: one(messages, {
		fields: [conversation_participants.last_read_message_id],
		references: [messages.id]
	}),
}));