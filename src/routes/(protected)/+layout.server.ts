export const load = async (event) => {
	// console.log(event.locals);
	return { user: event.locals.user };
};
