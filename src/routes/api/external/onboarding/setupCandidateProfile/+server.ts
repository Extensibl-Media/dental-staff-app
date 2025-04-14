import { authenticateUser } from '$lib/server/serverUtils';
import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import db from '$lib/server/database/drizzle';
import { newCandidateProfileSchema } from '$lib/config/zod-schemas';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import { eq } from 'drizzle-orm';
import { regionTable } from '$lib/server/database/schemas/region';
import { STATES } from '$lib/config/constants';
import { updateUser } from '$lib/server/database/queries/users';

async function updateRegionFromState(profileId: string, state: string) {
	if (!state) return null;

	const validRegionCode = STATES.find((stateObj) => stateObj.abbreviation === state)?.abbreviation;

	if (!validRegionCode) return null;

	const [regionData] = await db
		.select()
		.from(regionTable)
		.where(eq(regionTable.abbreviation, validRegionCode));

	if (!regionData) return null;

	const [updatedProfile] = await db
		.update(candidateProfileTable)
		.set({ regionId: regionData.id })
		.where(eq(candidateProfileTable.id, profileId))
		.returning();

	return updatedProfile;
}

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
		const user = await authenticateUser(request);
		if (!user) {
			return json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401, headers: corsHeaders }
			);
		}

		const body = await request.json().catch(() => null);
		if (!body || typeof body !== 'object') {
			return json(
				{ success: false, message: 'Invalid request body' },
				{ status: 400, headers: corsHeaders }
			);
		}

		const parsedProfile = newCandidateProfileSchema.safeParse(body);
		if (!parsedProfile.success) {
			return json(
				{ success: false, message: 'Invalid profile', errors: parsedProfile.error.flatten() },
				{ status: 400, headers: corsHeaders }
			);
		}

		// Check if the user already has a profile
		const [existingProfile] = await db
			.select()
			.from(candidateProfileTable)
			.where(eq(candidateProfileTable.userId, user.id));

		if (existingProfile) {
			console.log('updating profile', existingProfile.id);
			const profile = parsedProfile.data;
			const updatedData = {
				...profile,
				updatedAt: new Date(),
				birthday: profile.birthday ? new Date(profile.birthday).toISOString() : null
			};

			const [updatedProfile] = await db
				.update(candidateProfileTable)
				.set(updatedData)
				.where(eq(candidateProfileTable.id, existingProfile.id))
				.returning();

			if (updatedProfile.state) {
				await updateRegionFromState(updatedProfile.id, updatedProfile.state);
				console.log('profile and region updated!');
			}
			console.log('profile updated!');

			await updateUser(user.id, { onboardingStep: 2 });

			return json(
				{
					success: true,
					message: 'Profile updated successfully',
					profile: updatedProfile
				},
				{ status: 200, headers: corsHeaders }
			);
		}

		const profile = parsedProfile.data;
		const profileData = {
			...profile,
			hourlyRateMin: profile.hourlyRateMin || 0,
			hourlyRateMax: profile.hourlyRateMax || 0,
			userId: user.id, // Explicitly set the user ID
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			birthday: profile.birthday ? new Date(profile.birthday).toISOString() : null
		};

		const [newProfile] = await db.insert(candidateProfileTable).values(profileData).returning();

		if (!newProfile) {
			return json(
				{ success: false, message: 'Failed to create profile' },
				{ status: 500, headers: corsHeaders }
			);
		}

		if (newProfile.state) {
			await updateRegionFromState(newProfile.id, newProfile.state);
		}

		await updateUser(user.id, { onboardingStep: 2 });

		return json(
			{ success: true, message: 'Profile created successfully', profile: newProfile },
			{ status: 200, headers: corsHeaders }
		);
	} catch (error) {
		console.error('Error creating candidate profile:', error);
		return json(
			{ success: false, message: 'An unexpected error occurred' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
