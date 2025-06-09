import { getUserByToken, updateUser } from '$lib/server/database/queries/users';
import { fail } from '@sveltejs/kit';
import { EmailService } from '$lib/server/email/emailService';
import type { User } from '$lib/server/database/schemas/auth';

export async function load({ params }) {
	try {
		const token = params.token as string;
		const user: User | null = await getUserByToken(token);
		const emailService = new EmailService();
		if (!user) {
			return fail(500, { error: 'User not found' });
		}

		let heading = 'Email Verification Problem';
		let message =
			'Your email could not be verified. Please contact support if you feel this is an error.';

		if (user) {
			await emailService.sendWelcomeEmail(user.email);
			heading = 'Email Verified';
			message =
				'Your email has been verified. You can now <a href="/auth/sign-in" class="underline">sign in</a>';
			await updateUser(user.id, { verified: true });
		}
		return { heading, message };
	} catch (e) {
		return fail(500, { error: e });
	}
}
