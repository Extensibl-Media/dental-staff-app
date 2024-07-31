import { count, eq, sql } from 'drizzle-orm';
import db from '../drizzle';
import {
	regionTable,
	subRegionTable,
	subregionZipcodeTable,
	type Region,
	type Subregion,
	type UpdateRegion,
	type UpdateSubregion
} from '../schemas/region';

export type RegionRaw = {
	id: string;
	name: string;
	abbreviation: string;
};

export type RegionsResults = RegionRaw[];

export async function getPaginatedRegions({
	limit = 25,
	offset = 0,
	orderBy = undefined
}: {
	limit: number;
	offset: number;
	orderBy?: { column: string; direction: string };
}) {
	try {
		const orderSelector = orderBy ? `r.${orderBy.column}` : null;

		const query = sql.empty();

		query.append(sql`
      SELECT r.*
      FROM ${regionTable} AS r
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
    ORDER BY r.created_at DESC
  `);
		}

		query.append(sql`
      LIMIT ${limit}
      OFFSET ${offset}
    `);

		const countResult = await db.select({ value: count() }).from(regionTable);
		const results = await db.execute(query);

		return {
			regions: results.rows,
			count: countResult[0].value
		};
	} catch (error) {
		console.error(error);
	}
}

export async function getAllRegions() {
	return await db.select().from(regionTable);
}

export async function getRegionByAbbreviation(abbreviation: string) {
	const results = await db
		.select()
		.from(regionTable)
		.where(eq(regionTable.abbreviation, abbreviation));

	return results[0];
}

export async function getAllSubregions() {
	return await db.select().from(subRegionTable);
}

export async function getSubregionsByRegionId(regionId: string) {
	return await db.select().from(subRegionTable).where(eq(subRegionTable.regionId, regionId));
}

export async function createNewRegion(values: Region) {
	const result = await db.insert(regionTable).values(values).onConflictDoNothing().returning();
	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function updateRegion(regionId: string, values: UpdateRegion) {
	const result = await db
		.update(regionTable)
		.set(values)
		.where(eq(regionTable.id, regionId))
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function deleteRegion(regionId: string) {
	const result = await db.delete(regionTable).where(eq(regionTable.id, regionId)).returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function createNewSubregion(values: Subregion, zipcodes: string[] | undefined) {
	const result = await db.insert(subRegionTable).values(values).onConflictDoNothing().returning();

	if (zipcodes) {
		const formattedZipcodes = zipcodes.map((code: string) => ({
			code: code,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			subregionId: result[0].id
		}));

		await db
			.insert(subregionZipcodeTable)
			.values(formattedZipcodes)
			.onConflictDoNothing()
			.returning();
	}

	if (result.length === 0) {
		return null;
	} else {
		return { subregion: result[0] };
	}
}

export async function updateSubregion(subregionId: string, values: UpdateSubregion) {
	const result = await db
		.update(regionTable)
		.set(values)
		.where(eq(subRegionTable.id, subregionId))
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function deleteSubregion(subregionId: string) {
	const result = await db
		.delete(subRegionTable)
		.where(eq(subRegionTable.id, subregionId))
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}
