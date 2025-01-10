import { getAvg, getMin, getMax, getCount, getSum } from "./applyMethods";
import { InsightResult, InsightError } from "./IInsightFacade";
import { Transformations, Key, KEYVALUES, ApplyToken, MKEYVALUES, ApplyRule } from "./Query";
import { TWO } from "./queryMethods";

export function transfromQuery(
	TRANS: Transformations,
	db: InsightResult[],
	name: string,
	columns: string[]
): InsightResult[] {
	//let applyRuleNames = [];
	let groups = new Map<string | number, InsightResult[]>();
	groups.set("key", db);
	const tempGroups = new Map<string | number, InsightResult[]>(); //goal is to group, then regroup with each grouping key

	columnValidation(columns, TRANS);

	groups = createGroups(TRANS, name, db, tempGroups, groups);

	const groupArr = [];
	const ret: InsightResult[] = [];
	for (const group of groups.values()) {
		groupArr.push(group);
	}
	const seen = new Set();
	performApply(groupArr, TRANS, seen, ret);

	return ret;
}
function performApply(
	groupArr: InsightResult[][],
	TRANS: Transformations,
	seen: Set<unknown>,
	ret: InsightResult[]
): void {
	for (const group of groupArr) {
		const sect: InsightResult = {};
		for (const keyValue of TRANS.GROUP) {
			const [, field] = keyValue.split("_");
			sect[field] = group[0][field];
		}

		for (const applyRule of TRANS.APPLY) {
			if (typeof applyRule === "object") {
				const applyKey = applyErrorHandling(applyRule, seen);
				seen.add(applyKey);
				const tokenObj = applyRule[applyKey];
				const token = Object.keys(tokenObj)[0] as ApplyToken; //Avg
				const tokenDBField = tokenObj[token]; //sections_avg
				const [, field] = tokenDBField.split("_");
				tokenDirector(field, token, group, applyKey, sect);
			}
		}
		ret.push(sect);
		seen.clear();
	}
}

function applyErrorHandling(applyRule: ApplyRule, seen: Set<unknown>): string {
	if (Object.keys(applyRule).length > 1) {
		throw new InsightError("Apply rule should not have " + Object.keys(applyRule).length + " keys");
	}
	const applyKey = Object.keys(applyRule)[0]; //overallAvg
	if (applyKey.indexOf("_") !== -1) {
		throw new InsightError("Apply keuy cannot have an _");
	}
	if (typeof applyKey !== "string" || applyKey === "") {
		throw new InsightError("Apply key cannot be empty");
	}
	if (seen.has(applyKey) === true) {
		throw new InsightError("Duplicate applykey: " + applyKey);
	}
	return applyKey;
}

function tokenDirector(
	field: string,
	token: string,
	group: InsightResult[],
	applyKey: string,
	sect: InsightResult
): void {
	if (MKEYVALUES.indexOf(field) === -1 && token !== "COUNT") {
		throw new InsightError("Invalid key for " + token);
	}

	if (token === "AVG") {
		const result = getAvg(group, applyKey, field);
		sect[applyKey] = result[applyKey];
	}
	if (token === "MIN") {
		const result = getMin(group, applyKey, field);
		sect[applyKey] = result[applyKey];
	}
	if (token === "MAX") {
		const result = getMax(group, applyKey, field);
		sect[applyKey] = result[applyKey];
	}
	if (token === "COUNT") {
		const result = getCount(group, applyKey, field);
		sect[applyKey] = result[applyKey];
	}
	if (token === "SUM") {
		const result = getSum(group, applyKey, field);
		sect[applyKey] = result[applyKey];
	}
}

function createGroups(
	TRANS: Transformations,
	name: string,
	db: InsightResult[],
	tempGroups: Map<string | number, InsightResult[]>,
	groups: Map<string | number, InsightResult[]>
): Map<string | number, InsightResult[]> {
	for (const group of TRANS.GROUP) {
		if (group.indexOf("_") === -1 || group.split("_").length > TWO) {
			throw new InsightError("Must have 1 underscore");
		}
		const [dbName, aKey] = group.split("_");
		const key = aKey as Key;
		if (KEYVALUES.indexOf(key) === -1) {
			throw new InsightError(key + " is not a valid key");
		}
		if (dbName !== name) {
			throw new InsightError(db + " more than 1 database");
		}

		tempGroups.clear();

		pushToGroups(groups, key, tempGroups);
		groups = new Map(tempGroups);
	}
	return groups;
}

function pushToGroups(
	groups: Map<string | number, InsightResult[]>,
	key: string,
	tempGroups: Map<string | number, InsightResult[]>
): void {
	for (const mapKey of groups.keys()) {
		if (groups.get(mapKey) === undefined) {
			continue;
		}
		const items = groups.get(mapKey);
		if (items) {
			for (const section of items) {
				const index = section[key as Key] as string;
				if (tempGroups.get(mapKey + index) === undefined) {
					tempGroups.set(mapKey + index, []);
				}
				tempGroups.get(mapKey + index)?.push(section);
			}
		}
	}
}

function columnValidation(columns: string[], TRANS: Transformations): void {
	for (const column of columns) {
		if (column.split("_").length > 1) {
			//dataset kind
			if (TRANS.GROUP.indexOf(column) === -1) {
				throw new InsightError("Colum key " + column + " should be in GROUP");
			}
		} else {
			let flag = 0;
			for (const applyRule of TRANS.APPLY) {
				if (typeof applyRule === "object") {
					const applyKey = Object.keys(applyRule)[0]; //overallAvg
					if (applyKey === column) {
						flag = 1;
						break;
					}
				}
			}
			if (flag === 0) {
				throw new InsightError("Colum key " + column + " should be in APPLY");
			}
		}
	}
}
