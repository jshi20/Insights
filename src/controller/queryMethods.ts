import { InsightError, InsightResult } from "./IInsightFacade";
import {
	Query,
	Filter,
	MComparison,
	SComparison,
	Negation,
	Options,
	SField,
	MField,
	Key,
	KEYVALUES,
	RoomMField,
	RoomSField,
	// RoomMField,
	// RoomSField,
	// ANYKEY,
} from "./Query";
import * as fs from "fs-extra";
import { isLogicComparison, isMComparison, isSComparison, isNegation } from "./queryValidation";
// import { getAvg, getMin, getMax, getCount, getSum } from "./applyMethods";
import { transfromQuery } from "./transfromQuery";
import { TidyRoomDataset } from "./addRoomsTypes";
import { TidySectionDataset } from "./addStuff";
import Decimal from "decimal.js";
export const TWO = 2;

export function getName(obj: Query): string {
	const columns = obj.OPTIONS.COLUMNS;
	const names = columns[0].split("_");
	return names[0];
}
function isRoomDataset(data: TidyRoomDataset | TidySectionDataset): data is TidyRoomDataset {
	return "Rooms" in data;
}
export async function getDB(dbName: string): Promise<InsightResult[]> {
	const data = await fs.readFile(`./data/${dbName}.json`, "utf-8");
	const parsedData = JSON.parse(data) as TidyRoomDataset | TidySectionDataset;
	const ret: InsightResult[] = [];

	if (isRoomDataset(parsedData)) {
		// Handle Room dataset
		for (const room of parsedData.Rooms) {
			const IR: InsightResult = {};
			for (const key of Object.keys(room)) {
				IR[key] = room[key as RoomMField | RoomSField];
			}
			ret.push(IR);
		}
	} else {
		// Handle Section dataset
		for (const section of parsedData.allSections) {
			const IR: InsightResult = {};
			for (const key of Object.keys(section)) {
				IR[key] = section[key as Key];
			}
			ret.push(IR);
		}
	}

	return ret;
}

export function beginQuery(query: Query, database: InsightResult[], name: string): InsightResult[] {
	let whereResult = logicalQuery(query.WHERE, database, name);
	const columns = getColumns(query.OPTIONS);

	if (query.TRANSFORMATIONS) {
		whereResult = transfromQuery(query.TRANSFORMATIONS, whereResult, name, columns);
	}
	const results = optionsQuery(query.OPTIONS, whereResult, name);

	return results;
}

export function getColumns(query: Options): string[] {
	return query.COLUMNS;
}

export function logicalQuery(query: Filter, sections: InsightResult[], name: string): InsightResult[] {
	if (Object.keys(query).length === 0 && !("AND" in query)) {
		return sections;
	}

	try {
		if (isLogicComparison(query)) {
			if (query.AND?.length === 0 || query.OR?.length === 0) {
				throw new InsightError();
			}
			if ("AND" in query && Array.isArray(query.AND)) {
				const filteredArrays = query.AND.map((filter) => logicalQuery(filter, sections, name));

				return combineTidySectionsWithAND(...filteredArrays);
			} else if ("OR" in query && Array.isArray(query.OR)) {
				return query
					.OR!.flatMap((filter) => logicalQuery(filter, sections, name))
					.filter((v, i, a) => a.findIndex((t) => (t.uuid || createID(t)) === (v.uuid || createID(v))) === i);
			}
		}
	} catch {
		//
	}

	if (isMComparison(query)) {
		return mComparisonQuery(query, sections, name);
	}

	if (isSComparison(query)) {
		return sComparisonQuery(query, sections, name);
	}

	if (isNegation(query)) {
		return getNegation(query, sections, name);
	}

	throw new InsightError("Invalid query structure");
}

function getNegation(query: Negation, sections: InsightResult[], name: string): InsightResult[] {
	const positiveResult = logicalQuery(query.NOT, sections, name);

	const positiveIds = new Set(positiveResult.map((item) => item.uuid || createID(item)));

	const difference = sections.filter((item) => !positiveIds.has(item.uuid || createID(item)));

	return difference;
}

function combineTidySectionsWithAND(...arrays: InsightResult[][]): InsightResult[] {
	if (arrays.length === 0) {
		return [];
	}
	if (arrays.length === 1) {
		return arrays[0];
	}

	let result = new Set(arrays[0].map((item) => item.uuid || createID(item)));

	for (let i = 1; i < arrays.length; i++) {
		const currentIds = new Set(arrays[i].map((item) => item.uuid || createID(item)));
		result = new Set(Array.from(result).filter((id) => currentIds.has(id)));
	}

	return arrays[0].filter((item) => result.has(item.uuid || createID(item)));
}

// Helper function to create a unique identifier for items that don't have a UUID
function createID(item: InsightResult): string {
	if ("fullname" in item) {
		// It's a room
		return `${item.fullname}_${item.number}_${item.address}`.replace(/\s+/g, "_");
	}
	// It's a section, return existing UUID
	return item.uuid as string;
}

export function mComparisonQuery(query: MComparison, sections: InsightResult[], name: string): InsightResult[] {
	const [operator, condition] = Object.entries(query)[0];
	const [field, value] = Object.entries(condition)[0];
	const [dbName, mfield] = field.split("_");

	if (dbName !== name) {
		throw new InsightError("Database name mismatch");
	}

	// Convert the comparison value to Decimal
	if (typeof value !== "number") {
		throw new InsightError("bruh");
	}
	const decimalValue = new Decimal(value);

	return sections.filter((section) => {
		const sectionValue = section[mfield as MField | RoomMField];
		if (typeof sectionValue !== "number") {
			throw new InsightError(`Field ${mfield} is not a number in section`);
		}

		// Convert section value to Decimal for comparison
		const decimalSectionValue = new Decimal(sectionValue);

		switch (operator) {
			case "LT":
				return decimalSectionValue.lessThan(decimalValue);
			case "GT":
				return decimalSectionValue.greaterThan(decimalValue);
			case "EQ":
				return decimalSectionValue.equals(decimalValue);
			default:
				throw new InsightError("Invalid MComparison operator");
		}
	});
}

export function sComparisonQuery(query: SComparison, sections: InsightResult[], name: string): InsightResult[] {
	const [field, pattern] = Object.entries(query.IS)[0];
	const [dbName, sfield] = field.split("_");
	if (dbName !== name) {
		throw new InsightError("Cant use 2 dbs");
	}
	return sections.filter((section) => {
		const sectionValue = section[sfield as SField | RoomSField];

		// Skip UUID comparison for rooms if they don't have one
		if (sfield === "uuid" && !sectionValue) {
			return false;
		}

		if (typeof sectionValue !== "string") {
			throw new InsightError(`Field ${sfield} is not a string in section`);
		}

		if (pattern.slice(1, pattern.length - 1).indexOf("*") !== -1) {
			throw new InsightError("* should not be within name");
		}

		if (pattern.startsWith("*") && pattern.endsWith("*")) {
			return sectionValue.includes(pattern.slice(1, -1));
		} else if (pattern.startsWith("*")) {
			return sectionValue.endsWith(pattern.slice(1));
		} else if (pattern.endsWith("*")) {
			return sectionValue.startsWith(pattern.slice(0, -1));
		} else {
			if (pattern.includes("*")) {
				throw new InsightError("* must be at the beginning or end");
			}
			return sectionValue === pattern;
		}
	});
}

export function optionsQuery(options: Options, sections: InsightResult[], name: string): InsightResult[] {
	if (sections.length === 0) {
		return [];
	}

	const result: InsightResult[] = sections.map((section) => {
		const newSection: InsightResult = {};
		const badLength = 2;
		for (const column of options.COLUMNS) {
			if (column.split("_").length > badLength) {
				throw new InsightError("Invalid column format");
			}
			let value;
			if (column.split("_").length > 1) {
				const [db, field] = column.split("_");
				if (KEYVALUES.indexOf(field) === -1) {
					throw new InsightError("Invalid key");
				} else if (db !== name) {
					throw new InsightError("Database name mismatch");
				}
				value = section[field];
			} else {
				value = section[column];
			}

			if (typeof value === "string" || typeof value === "number") {
				newSection[column] = value;
			} else {
				throw new InsightError("Invalid column value type");
			}
		}
		return newSection;
	});

	return getOptions(options, name, result);
}

function getOptions(options: Options, name: string, result: InsightResult[]): InsightResult[] {
	if (!options) {
		return result;
	}

	if (typeof options.ORDER === "string") {
		const [db] = options.ORDER.split("_");
		if (db !== name) {
			throw new InsightError("Database name mismatch for ordering");
		}
		if (options.COLUMNS.indexOf(options.ORDER) === -1) {
			throw new InsightError("ORDER must be a value in COLUMNS");
		}

		result.sort((a, b) => {
			return compareValues(a[options.ORDER as string], b[options.ORDER as string]);
		});
	} else if (typeof options.ORDER === "object") {
		return optionsWKeys(options, result);
	}
	return result;
}

function compareValues(a: any, b: any): number {
	// If both values are numbers
	if (typeof a === "number" && typeof b === "number") {
		return new Decimal(a).lessThan(new Decimal(b)) ? -1 : new Decimal(a).greaterThan(new Decimal(b)) ? 1 : 0;
	}
	// For strings or mixed types, use simple comparison
	const strA = String(a);
	const strB = String(b);
	return strA < strB ? -1 : strA > strB ? 1 : 0;
}

function optionsWKeys(options: Options, result: InsightResult[]): InsightResult[] {
	if (typeof options.ORDER === "object" && options.ORDER !== null) {
		const { dir, keys } = options.ORDER;

		if (!dir || !keys) {
			throw new InsightError("Invalid ORDER object structure");
		}
		if (dir !== "UP" && dir !== "DOWN") {
			throw new InsightError("Invalid direction");
		}

		keys.forEach((key) => {
			if (options.COLUMNS.indexOf(key) === -1) {
				throw new InsightError("ORDER keys must be present in COLUMNS");
			}
		});

		const direction = dir === "UP" ? 1 : -1;

		result.sort((a, b) => {
			for (const key of keys) {
				const comparison = compareValues(a[key], b[key]);
				if (comparison !== 0) {
					return comparison * direction;
				}
			}
			return 0;
		});

		return result;
	}
	throw new InsightError("Invalid ORDER specification");
}
