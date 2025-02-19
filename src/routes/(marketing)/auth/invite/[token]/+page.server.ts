// src/routes/auth/invite/[token]/+page.server.ts
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import db from '$lib/server/database/drizzle.js';
import { companyStaffInviteLocations, userInviteTable, userTable } from '$lib/server/database/schemas/auth';
import { getClientCompanyById } from '$lib/server/database/queries/clients';

export async function load(event) {
  const token = event.params.token;

  try {
    // Get the invite details
    const [invite] = await db
      .select()
      .from(userInviteTable)
      .where(eq(userInviteTable.token, token));

    if (!invite) {
      return {
        status: 'error',
        heading: 'Invalid Invitation',
        message: 'This invitation link is invalid or has expired. Please contact your administrator for a new invitation.'
      };
    }

    // Check if invite has expired
    if (new Date() > new Date(invite.expiresAt)) {
      return {
        status: 'error',
        heading: 'Invitation Expired',
        message: 'This invitation has expired. Please contact your administrator for a new invitation.'
      };
    }

    // Check if the email is already registered
    const [existingUser] = await db
      .select({ id: userTable.id, email: userTable.email })
      .from(userTable)
      .where(eq(userTable.email, invite.email));

    if (existingUser) {
      return {
        status: 'error',
        heading: 'Account Already Exists',
        message: `An account with this email already exists. Please <a href="/auth/sign-in" class="underline">sign in</a> to continue.`
      };
    }

    // Get the location assignments
    const locationAssignments = await db
      .select()
      .from(companyStaffInviteLocations)
      .where(eq(companyStaffInviteLocations.token, token));

    const company = await getClientCompanyById(invite.companyId)

    // Return the invite data to display on the page
    return {
      status: 'success',
      invite: {
        email: invite.email,
        company: company.companyName,
        companyId: invite.companyId,
        staffRole: invite.staffRole,
        locations: locationAssignments.map(la => la.locationId)
      }
    };
  } catch (error) {
    console.error('Error processing invite:', error);
    return {
      status: 'error',
      heading: 'Error Processing Invitation',
      message: 'There was a problem processing your invitation. Please try again or contact support.'
    };
  }
}

export const actions = {
  default: async (event) => {
    const token = event.params.token;
    const [invite] = await db
      .select()
      .from(userInviteTable)
      .where(eq(userInviteTable.token, token));

    try {
      // Get the invite details again (to prevent tampering)

      if (!invite || new Date() > new Date(invite.expiresAt)) {
        return fail(400, {
          message: 'Invalid or expired invitation'
        });
      }

      // Store invite data in session for use during registration
      const locationAssignments = await db
        .select()
        .from(companyStaffInviteLocations)
        .where(eq(companyStaffInviteLocations.token, token));

      const inviteData = {
        token,
        email: invite.email,
        companyId: invite.companyId,
        staffRole: invite.staffRole,
        invitedRole: invite.invitedRole,
        locations: locationAssignments.map(la => la.locationId)
      };

      event.cookies.set('staff_invite', JSON.stringify(inviteData), {
        path: '/',
        maxAge: 60 * 15, // 15 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Redirect to registration page
    } catch (error) {
      console.error('Error accepting invite:', error);
      return fail(500, {
        message: 'Error processing invitation. Please try again.'
      });
    }
    return redirect(302, `/auth/sign-up?email=${encodeURIComponent(invite.email)}&invite=true`);
  }
};