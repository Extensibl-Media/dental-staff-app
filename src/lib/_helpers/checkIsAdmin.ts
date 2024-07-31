export function checkIsAdmin(role: string | undefined) {
	if (!role) {
		return false;
	}
	return ['SUPERADMIN', 'ADMIN'].includes(role);
}
