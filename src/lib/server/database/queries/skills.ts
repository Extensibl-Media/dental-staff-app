import { asc, count, desc, eq, sql } from 'drizzle-orm';
import db from '../drizzle';
import {
	skillTable,
	skillCategoryTable,
	type Skill,
	type SkillCategory,
	disciplineTable,
	experienceLevelTable,
	type ExperienceLevel,
	type UpdateExperienceLevel
} from '../schemas/skill';
import type { PaginateOptions } from '$lib/types';

export type SkillsWithCategoryRaw = {
	id: string;
	name: string;
	category_name: string;
};

export type SkillsResults = SkillsWithCategoryRaw[];

export type ExperienceLevelsRaw = {
	id: string;
	value: string;
};

export type ExperienceLevelResults = ExperienceLevelsRaw[];

export async function getPaginatedSkills({
	limit = 25,
	offset = 0,
	orderBy = undefined
}: PaginateOptions) {
	try {
		const orderSelector = orderBy
			? orderBy.column === 'category_name'
				? `${orderBy.column}`
				: `s.${orderBy.column}`
			: null;

		const query = sql.empty();

		query.append(sql`
      SELECT s.*, c.name AS category_name
      FROM ${skillTable} AS s
      INNER JOIN ${skillCategoryTable} c ON s.category_id = c.id
    `);

		if (orderSelector && orderBy) {
			query.append(sql`
    ORDER BY ${
			orderBy.direction === 'asc'
				? sql`${sql.raw(orderSelector)} ASC`
				: sql`${sql.raw(orderSelector)} DESC`
		}
  `);
		} else {
			query.append(sql`
    ORDER BY s.created_at DESC
  `);
		}

		query.append(sql`
      LIMIT ${limit}
      OFFSET ${offset}
    `);

		const countResult = await db.select({ value: count() }).from(skillTable);

		const results = await db.execute(query);

		return {
			skills: results.rows,
			count: countResult[0].value
		};
	} catch (error) {
		console.error(error);
	}
}

export async function getAllSkills() {
	return await db
		.select()
		.from(skillTable)
		.innerJoin(skillCategoryTable, eq(skillCategoryTable.id, skillTable.categoryId))
		.orderBy(desc(skillTable.createdAt));
}

export async function createNewSkill(values: Skill) {
	const result = await db.insert(skillTable).values(values).onConflictDoNothing().returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function getPaginatedSkillGategories({
	limit = 25,
	offset = 0,
	orderBy = undefined
}: PaginateOptions) {
	try {
		const orderSelector = orderBy ? `${orderBy.column}` : null;

		const query = sql.empty();

		query.append(sql`
      SELECT *
      FROM ${skillCategoryTable}
    `);

		if (orderSelector && orderBy) {
			query.append(sql`
    ORDER BY ${
			orderBy.direction === 'asc'
				? sql`${sql.raw(orderSelector)} ASC`
				: sql`${sql.raw(orderSelector)} DESC`
		}
  `);
		} else {
			query.append(sql`
    ORDER BY created_at DESC
  `);
		}

		query.append(sql`
      LIMIT ${limit}
      OFFSET ${offset}
    `);

		const countResult = await db.select({ value: count() }).from(skillCategoryTable);

		const results = await db.execute(query);

		console.log({ results });

		return {
			categories: results.rows,
			count: countResult[0].value
		};
	} catch (error) {
		console.error(error);
	}
}

export async function getAllSkillGategories(): Promise<SkillCategory[]> {
	return await db.select().from(skillCategoryTable).orderBy(desc(skillCategoryTable.createdAt));
}

export async function createNewSkillCategory(values: SkillCategory) {
	const result = await db
		.insert(skillCategoryTable)
		.values(values)
		.onConflictDoNothing()
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function getAllDisciplines() {
	return await db.select().from(disciplineTable).orderBy(asc(disciplineTable.name));
}

export async function getAllExperienceLevels() {
	return await db.select().from(experienceLevelTable).orderBy(asc(experienceLevelTable.value));
}

export async function getPaginatedExperienceLevels({
	limit = 10,
	offset = 0,
	orderBy = undefined
}: PaginateOptions) {
	try {
		const orderSelector = orderBy ? `e.${orderBy.column}` : null;

		const query = sql.empty();

		query.append(sql`
      SELECT e.*
      FROM ${experienceLevelTable} AS e
    `);

		if (orderSelector && orderBy) {
			query.append(sql`
				ORDER BY ${
					orderBy.direction === 'asc'
						? sql`${sql.raw(orderSelector)} ASC`
						: sql`${sql.raw(orderSelector)} DESC`
				}
			`);
		} else {
			query.append(sql`
				ORDER BY e.created_at DESC
			`);
		}

		query.append(sql`
      LIMIT ${limit}
      OFFSET ${offset}
    `);

		const countResult = await db.select({ value: count() }).from(experienceLevelTable);

		const results = await db.execute(query);

		return {
			experienceLevels: results.rows,
			count: countResult[0].value
		};
	} catch (error) {
		console.error(error);
	}
}

export async function createNewExperienceLevel(values: ExperienceLevel) {
	const result = await db
		.insert(experienceLevelTable)
		.values(values)
		.onConflictDoNothing()
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function updateExperienceLevel(id: string, values: UpdateExperienceLevel) {
	const result = await db
		.update(experienceLevelTable)
		.set(values)
		.where(eq(experienceLevelTable.id, id))
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function deleteExperienceLevel(id: string) {
	const result = await db
		.delete(experienceLevelTable)
		.where(eq(experienceLevelTable.id, id))
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}
