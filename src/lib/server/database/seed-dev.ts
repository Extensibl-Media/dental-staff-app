import { faker } from '@faker-js/faker';
import { sessionTable, userTable, type User } from './schemas/auth';
import { Argon2id } from 'oslo/password';
import {
	CLIENT_STAFF_ROLES,
	DEV_SUPERADMIN_EMAIL,
	DEV_SUPERADMIN_PASSWORD,
	STATES,
	USER_ROLES,
	dentalStaffDisciplines,
	experienceLevels,
	skillsByCategory
} from '../../config/constants';
// } from '$lib/config/constants';
import {
	clientCompanyTable,
	clientProfileTable,
	clientStaffLocationTable,
	clientStaffProfileTable,
	companyOfficeLocationTable,
	type ClientCompany,
	type ClientCompanyLocation,
	type ClientCompanyStaffProfile,
	type ClientProfile
} from './schemas/client';
import { format } from 'date-fns';
import { regionTable, type Region } from './schemas/region';
import {
	candidateDisciplineExperienceTable,
	candidateProfileTable,
	type CandidateProfile
} from './schemas/candidate';
import db from './drizzle';
import {
	disciplineTable,
	experienceLevelTable,
	skillCategoryTable,
	skillTable,
	type Discipline,
	type ExperienceLevel,
	type Skill,
	type SkillCategory
} from './schemas/skill';
import {
	recurrenceDayTable,
	requisitionTable,
	timeSheetTable,
	workdayTable
} from './schemas/requisition';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const randomProperty = function (obj: any) {
	const keys = Object.keys(obj);
	return obj[keys[(keys.length * Math.random()) << 0]];
};

async function generateClientRecords(count: number) {
	const userRecords: User[] = [];
	const clientRecords: ClientProfile[] = [];
	const companyRecords: ClientCompany[] = [];

	for (let i = 0; i < count; i++) {
		const token = crypto.randomUUID();
		const uid = crypto.randomUUID();
		const clientId = crypto.randomUUID();
		const companyId = crypto.randomUUID();

		userRecords.push({
			id: uid,
			token,
			avatarUrl: faker.image.avatar(),
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			email: faker.internet.email().toLowerCase(),
			role: USER_ROLES.CLIENT,
			password: await new Argon2id().hash('test1234'),
			receiveEmail: true,
			verified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		clientRecords.push({
			id: clientId,
			userId: uid,
			birthday: format(faker.date.birthdate({ min: 18, max: 70 }), 'P'),
			createdAt: new Date(),
			updatedAt: new Date()
		});
		companyRecords.push({
			id: companyId,
			clientId,
			createdAt: new Date(),
			updatedAt: new Date(),
			companyName: faker.company.name(),
			licenseNumber: faker.number.bigInt({ min: 999999999999n }).toString()
		});
	}
	return { clientRecords, companyRecords, userRecords };
}

async function generateRegionsRecords() {
	const regions: Region[] = [];
	for (const state of STATES) {
		const id = crypto.randomUUID();

		regions.push({
			id,
			createdAt: new Date(),
			updatedAt: new Date(),
			...state
		});
	}
	return regions;
}

async function generateClientCompanyOfficesRecords(
	count: number,
	companyId: string,
	regionId: string
) {
	const records: ClientCompanyLocation[] = [];

	for (let i = 0; i < count; i++) {
		const id = crypto.randomUUID();
		records.push({
			id,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date(),
			regionId,
			companyPhone: faker.phone.number(),
			streetOne: faker.location.streetAddress(),
			streetTwo: faker.location.secondaryAddress(),
			city: faker.location.city(),
			state: faker.location.state({ abbreviated: true }),
			zipcode: faker.location.zipCode(),
			cellPhone: faker.phone.number(),
			email: faker.internet.email().toLowerCase(),
			name: faker.lorem.words(3)
		});
	}
	return records;
}

async function generateStaffRecords(count: number, companyId: string, clientId: string) {
	const userRecords: User[] = [];
	const staffRecords: ClientCompanyStaffProfile[] = [];

	for (let i = 0; i < count; i++) {
		const token = crypto.randomUUID();
		const uid = crypto.randomUUID();
		const staffId = crypto.randomUUID();

		userRecords.push({
			id: uid,
			token,
			avatarUrl: faker.image.avatar(),
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			email: faker.internet.email().toLowerCase(),
			role: USER_ROLES.CLIENT_STAFF,
			password: await new Argon2id().hash('test1234'),
			receiveEmail: true,
			verified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		staffRecords.push({
			id: staffId,
			createdAt: new Date(),
			updatedAt: new Date(),
			staffRole: randomProperty(CLIENT_STAFF_ROLES),
			userId: uid,
			clientId,
			companyId
		});
	}
	return { userRecords, staffRecords };
}
async function generateCandidateRecords(count: number, regionId: string) {
	const userRecords: User[] = [];
	const candidateRecords: CandidateProfile[] = [];

	for (let i = 0; i < count; i++) {
		const token = crypto.randomUUID();
		const uid = crypto.randomUUID();
		const candidateId = crypto.randomUUID();

		userRecords.push({
			id: uid,
			token,
			avatarUrl: faker.image.avatar(),
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			email: faker.internet.email().toLowerCase(),
			role: USER_ROLES.CANDIDATE,
			password: await new Argon2id().hash('test1234'),
			receiveEmail: true,
			verified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		candidateRecords.push({
			id: candidateId,
			userId: uid,
			createdAt: new Date(),
			updatedAt: new Date(),
			hourlyRateMax: faker.number.int({ min: 25, max: 50 }),
			hourlyRateMin: faker.number.int({ min: 15, max: 24 }),
			citizenship: 'US Citizen',
			city: faker.location.city(),
			state: faker.location.state(),
			zipcode: faker.location.zipCode(),
			employeeNumber: faker.number.bigInt({ min: 999999999n }).toString(),
			birthday: format(faker.date.birthdate({ min: 18, max: 50 }), 'P'),
			cellPhone: faker.phone.number(),
			regionId,
			featureMe: faker.datatype.boolean()
		});
	}
	return { userRecords, candidateRecords };
}

async function generateDisciplineRecords() {
	const records: Discipline[] = [];

	for (const discipline of dentalStaffDisciplines) {
		const id = crypto.randomUUID();

		records.push({
			id,
			createdAt: new Date(),
			updatedAt: new Date(),
			name: discipline.discipline,
			abbreviation: discipline.abbreviation
		});
	}
	return records;
}

async function generateExperienceRecords() {
	const records: ExperienceLevel[] = [];

	for (const level of experienceLevels) {
		const id = crypto.randomUUID();

		records.push({
			id,
			createdAt: new Date(),
			updatedAt: new Date(),
			value: level
		});
	}
	return records;
}

async function generateCandidateExperience(
	candidateId: string,
	disciplineId: string,
	experienceLevelId: string
) {
	return {
		id: crypto.randomUUID(),
		candidateId,
		disciplineId,
		experienceLevelId
	};
}

async function generateSkillsRecords() {
	const categories: SkillCategory[] = [];
	const skills: Skill[] = [];

	for (const [k, v] of Object.entries(skillsByCategory)) {
		const catId = crypto.randomUUID();

		categories.push({
			id: catId,
			createdAt: new Date(),
			updatedAt: new Date(),
			name: k
		});

		for (const skill of v) {
			const skillId = crypto.randomUUID();

			skills.push({
				id: skillId,
				categoryId: catId,
				createdAt: new Date(),
				updatedAt: new Date(),
				name: skill
			});
		}
	}

	return { categories, skills };
}

// async function reset() {
// 	console.log(db);
// 	const tableSchema = db._.tableNamesMap;
// 	if (!tableSchema) {
// 		throw new Error('No table schema found');
// 	}

// 	console.log('🗑️ Emptying the entire database');
// 	const queries = Object.values(tableSchema).map((table) => {
// 		console.log(`🧨 Preparing delete query for table: ${table}`);
// 		return sql.raw(`DELETE FROM ${table};`);
// 	});

// 	console.log('🛜 Sending delete queries');

// 	await db.transaction(async (tx) => {
// 		await Promise.all(
// 			queries.map(async (query) => {
// 				if (query) await tx.execute(query);
// 			})
// 		);
// 	});

// 	console.log('✅ 🗑️ Database emptied');
// }

async function seed() {
	try {
		console.log('Seeding... 🌱');
		console.time('✅ 🌱 DB has been seeded!');

		// await reset();

		await db.delete(sessionTable);
		await db.delete(companyOfficeLocationTable);
		await db.delete(regionTable);
		await db.delete(clientStaffLocationTable);
		await db.delete(clientStaffProfileTable);
		await db.delete(clientProfileTable);
		await db.delete(clientCompanyTable);
		await db.delete(candidateDisciplineExperienceTable);
		await db.delete(disciplineTable);
		await db.delete(experienceLevelTable);
		await db.delete(candidateProfileTable);
		await db.delete(userTable);
		await db.delete(skillCategoryTable);
		await db.delete(skillTable);
		await db.delete(requisitionTable);
		await db.delete(timeSheetTable);
		await db.delete(workdayTable);
		await db.delete(recurrenceDayTable);

		const adminUsers: User[] = [
			{
				id: crypto.randomUUID(),
				token: crypto.randomUUID(),
				firstName: 'Brett',
				lastName: 'Cole',
				email: DEV_SUPERADMIN_EMAIL,
				password: await new Argon2id().hash(DEV_SUPERADMIN_PASSWORD),
				createdAt: new Date(),
				updatedAt: new Date(),
				role: USER_ROLES.SUPERADMIN,
				verified: true,
				receiveEmail: true
			},
			{
				id: crypto.randomUUID(),
				token: crypto.randomUUID(),
				firstName: 'Richard',
				lastName: 'Prins',
				email: 'extensiblmedia@gmail.com',
				password: await new Argon2id().hash('extensiblmedia'),
				createdAt: new Date(),
				updatedAt: new Date(),
				role: USER_ROLES.SUPERADMIN,
				verified: true,
				receiveEmail: true
			},
			{
				id: crypto.randomUUID(),
				token: crypto.randomUUID(),
				firstName: 'Shannon',
				lastName: 'Cole',
				email: 'shannon.cole@dentalstaff.us',
				password: await new Argon2id().hash(DEV_SUPERADMIN_PASSWORD),
				createdAt: new Date(),
				updatedAt: new Date(),
				role: USER_ROLES.SUPERADMIN,
				verified: true,
				receiveEmail: true
			},
			{
				id: crypto.randomUUID(),
				token: crypto.randomUUID(),
				firstName: 'Mike',
				lastName: 'Lazear',
				email: 'michaelreidlazear@gmail.com',
				password: await new Argon2id().hash('extensiblmedia'),
				createdAt: new Date(),
				updatedAt: new Date(),
				role: USER_ROLES.SUPERADMIN,
				verified: true,
				receiveEmail: true
			}
		];

		// Add SUPERADMINS
		await db.insert(userTable).values(adminUsers).returning();

		// Add Disciplines & Skills
		const disciplines = await generateDisciplineRecords();
		const { categories, skills } = await generateSkillsRecords();
		const experienceLevels = await generateExperienceRecords();
		await db.insert(disciplineTable).values(disciplines).returning();
		await db.insert(skillCategoryTable).values(categories).returning();
		await db.insert(skillTable).values(skills).returning();
		await db.insert(experienceLevelTable).values(experienceLevels).returning();

		// Generate Regions for all 50 States
		const regions = await generateRegionsRecords();
		await db.insert(regionTable).values(regions).returning();

		// Add Client Records
		const newClientRecords = await generateClientRecords(20);
		await db.insert(userTable).values(newClientRecords.userRecords).returning();
		await db.insert(clientProfileTable).values(newClientRecords.clientRecords).returning();
		await db.insert(clientCompanyTable).values(newClientRecords.companyRecords).returning();

		// Add Client Staff Records and Company Office Locations
		for (const client of newClientRecords.clientRecords) {
			const company = newClientRecords.companyRecords.find(
				(company) => company.clientId === client.id
			);

			const staff = await generateStaffRecords(5, company!.id, client.id);
			await db.insert(userTable).values(staff.userRecords).returning();
			await db.insert(clientStaffProfileTable).values(staff.staffRecords).returning();

			for (const region of regions) {
				const locations = await generateClientCompanyOfficesRecords(1, company!.id, region.id);
				await db.insert(companyOfficeLocationTable).values(locations).returning();
			}
		}

		// Add Candidate Records with some experience/discipline data
		for (const region of regions) {
			const candidates = await generateCandidateRecords(3, region.id);
			await db.insert(userTable).values(candidates.userRecords).returning();
			await db.insert(candidateProfileTable).values(candidates.candidateRecords).returning();

			for (const candidate of candidates.candidateRecords) {
				const candidateExperience = await generateCandidateExperience(
					candidate.id,
					disciplines[Math.floor(Math.random() * disciplines.length)].id,
					experienceLevels[Math.floor(Math.random() * experienceLevels.length)].id
				);
				await db.insert(candidateDisciplineExperienceTable).values(candidateExperience);
			}
		}

		console.timeEnd('DB has been seeded!');
	} catch (error) {
		console.error(error);
	}
}

seed()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		console.log('Seeding done!');
		process.exit(0);
	});
