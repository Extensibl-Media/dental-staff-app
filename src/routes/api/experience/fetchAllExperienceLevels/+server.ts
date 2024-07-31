import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllExperienceLevels } from '$lib/server/database/queries/skills';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		error(401, 'Unauthorized role, no access allowed.');
	}

	const experience = await getAllExperienceLevels();

	return json(experience);
};
