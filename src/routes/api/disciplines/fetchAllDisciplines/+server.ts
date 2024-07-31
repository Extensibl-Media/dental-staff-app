import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllDisciplines } from '$lib/server/database/queries/skills';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		error(401, 'Unauthorized role, no access allowed.');
	}

	const disciplines = await getAllDisciplines();

	return json(disciplines);
};
