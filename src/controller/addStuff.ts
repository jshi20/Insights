import { InsightError, InsightDatasetKind } from "../../src/controller/IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs-extra";
import * as pat from "path";
const DEFAULTYEAR = 1900;
const DATAFOLDERPATH = "./data"; //for pathGivenID function; any value works since if folder DNE it creates it

export interface RawCourse {
	result: RawSection[];
	rank: number;
}

export interface RawSection {
	tier_eighty_five?: number;
	tier_ninety?: number;
	Title: string;
	Section: string;
	Detail?: string;
	tier_seventy_two?: number;
	Other?: number;
	Low: number;
	tier_sixty_four?: number;
	id: number;
	tier_sixty_eight?: number;
	tier_zero?: number;
	tier_seventy_six?: number;
	tier_thirty?: number;
	tier_fifty?: number;
	Professor: string;
	Audit: number;
	tier_g_fifty?: number;
	tier_forty?: number;
	Withdrew?: number;
	Year: string;
	tier_twenty?: number;
	Stddev?: number;
	Enrolled?: number;
	tier_fifty_five?: number;
	tier_eighty?: number;
	tier_sixty?: number;
	tier_ten?: number;
	High?: number;
	Course: string;
	Session?: string;
	Pass: number;
	Fail: number;
	Avg: number;
	Campus?: string;
	Subject: string;
}

export interface TidySection {
	uuid: string;
	id: string;
	title: string;
	instructor: string;
	dept: string;
	year: number;
	avg: number;
	pass: number;
	fail: number;
	audit: number;
}

export interface Tidy {}

export interface TidySectionDataset extends Tidy {
	allSections: TidySection[];
}

/**
 * NOTE: You can change the path to anything, even if DNE fs.outputJson takes care of it
 * ex. "./exampleFolder/"
 *
 * REQUIRES: valid TidySection and valid ID
 * MODIFIES: none
 * BEHAVIOUR: takes TidySection, puts into .json and saves to path
 *
 * helper for addDataset
 *
 * @param data list of TidySection
 * @param id represents ID of dataset
 * @returns list of TidySection
 */
export async function toDataFolder(data: TidySection[], id: string): Promise<void> {
	const toAdd: TidySectionDataset = {
		allSections: data,
	};
	const path: string = pathGivenID(id);
	await fs.outputJson(path, toAdd);
}

/**
 * REQUIRES: String data
 * MODIFIES: none
 * BEHAVIOUR: Returns array where each is the OG .json file
 *
 * helper for addDataset
 *
 * @param data a Base64 string representation of zipped file
 * @returns a Promise object; resolves with each obj being the OG .json
 * rejects if error loading in the JSZip
 */
export async function turnB64ToJsonObjects(data: string): Promise<RawCourse[]> {
	// const isZipped: boolean = await isAllDataZipped(data);
	// if (!isZipped) {
	// 	throw new Error("broken");
	// }
	const unZipped = await JSZip.loadAsync(data, { base64: true });
	const listOfJsonObjects: RawCourse[] = [];

	const myPromises = Object.keys(unZipped.files).map(async (filename) => {
		const file = unZipped.files[filename];
		try {
			const fileData = await file.async("string");
			const jsonObj = JSON.parse(fileData);
			listOfJsonObjects.push(jsonObj);
		} catch {
			// Ignore JSON parsing errors and all else I DONT CAREE
		}
	});

	//Must wait for EVERYTHING to resolve/reject
	await Promise.all(myPromises);

	if (listOfJsonObjects.length <= 0) {
		throw new Error("listOfJsonObjects has length 0...");
	}

	return listOfJsonObjects;
}

/**
 * This seems absolutely useless
 *
 * @param data base64 string generated from giving a folder to fs.readFile
 * @returns true if all files/folders are zipped; false otherwise
 */
// export async function isAllDataZipped(data: string): Promise<boolean> {
// 	throw new Error(`hell, ${data}`);
// }

/**
 * REQUIRES: valid RawCourse[] data
 * MODIFIES: none
 * BEHAVIOUR: Parses RawCourse[] and turns each obj. in result to TidySection
 *
 * helper for addDataset
 *
 * @param data list of RawCourse
 * @returns list of TidySection
 */
export function RawCoursetoTidySections(data: RawCourse[]): TidySection[] {
	const ans: TidySection[] = [];

	data.forEach((rCourse) => {
		rCourse.result.map((rSection) => {
			let yearAns: number;
			if (rSection.Section === "overall") {
				yearAns = DEFAULTYEAR; //default is 1900
			} else {
				yearAns = Number(rSection.Year);
			}
			const toPush: TidySection = {
				uuid: String(rSection.id),
				id: rSection.Course,
				title: rSection.Title,
				instructor: rSection.Professor,
				dept: rSection.Subject,
				year: yearAns,
				avg: rSection.Avg,
				pass: rSection.Pass,
				fail: rSection.Fail,
				audit: rSection.Audit,
			};

			//ans.push(toPush);

			if (hasAllValidFields(toPush)) {
				ans.push(toPush);
			}

			// ans.push({
			// 	uuid: String(rSection.id),
			// 	id: rSection.Course,
			// 	title: rSection.Title,
			// 	instructor: rSection.Professor,
			// 	dept: rSection.Subject,
			// 	year: yearAns,
			// 	avg: rSection.Avg,
			// 	pass: rSection.Pass,
			// 	fail: rSection.Fail,
			// 	audit: rSection.Audit,
			// });
		});
	});

	if (ans.length <= 0) {
		throw new Error("TidySections length <= 0");
	}

	return ans;
}

/**
 * REQUIRES: string; returns bool based on addDataset ID spec.
 * MODIFIES: none
 * BEHAVIOUR: true if validID false otherwise; trim() removes all WS chars;
 *
 * helper for addDataset
 *
 * @param id is string representing name of dataset for addDataset
 * @returns boolean, true if validID
 */
export function isValidID(id: string): boolean {
	// if (id.includes("_") || id.trim().length === 0) {
	// 	return false;
	// }
	// return true;
	return !id.includes("_") && id.trim().length !== 0;
}

/**
 * REQUIRES: a valid ID
 * BEHAVIOUR: Func. to ensure only 1 point of control to the DATAFOLDERPATH folder
 *
 * @param id is string; ID of dataset
 * @returns the path given a valid ID
 */
export function pathGivenID(id: string): string {
	//return "./data" + id + ".json";
	return pat.join(DATAFOLDERPATH, `${id}.json`);
}

/**
 * REQUIRES: a valid ID
 * BEHAVOIOUR: Remove extension name
 *
 * @param id is string
 * @returns the ID with extension removed (so .json extension gone)
 */
export function removeExtension(id: string): string {
	return id.substring(0, id.lastIndexOf("."));
}

/** REQUIRES: generic object
 * BEHAVIOUR: if any field of the object is -1, undefined, or null
 * the object should be invalid and the func. will return false
 *
 * @param obj any generic object type
 * @returns boolean; true if all fields in an object valid
 */
export function hasAllValidFields<T extends object>(obj: T): boolean {
	for (const val of Object.values(obj)) {
		if (val === null || val === undefined || val === -1) {
			return false;
		}
	}
	return true;
}

/**
 * REQUIRE: string
 * BEHAVIOUR: Takes string, parses out white space chars, newline globally
 * using .replace and regex; .trim() removes leading and trailing, .replace works inside
 *
 * @param str string
 * @returns string without any white space charcters, newline characters
 */
export function removeSpace(str: string): string {
	return str.trim().replace(/\s+/g, " ");
}

/**
 * BEHAVIOUR: Checks that ID is valid, ID is not a duplicate, and the kind is either sections or rooms
 * @param id id for dataset
 * @param kind either section or rooms
 */
export async function checkIDPathKind(id: string, kind: InsightDatasetKind): Promise<void> {
	//Check if valid kind
	if (!Object.values(InsightDatasetKind).includes(kind)) {
		throw new InsightError("invalid kind in addDataset");
	}

	//Check that id given is not duplicate
	const path = pathGivenID(id);
	await fs.pathExists(path).then(function (exist) {
		if (exist) {
			throw new InsightError("Duplicate ID not allowed");
		}
	});

	//Check if validID, if not throw
	if (!isValidID(id)) {
		throw new InsightError(`InsightFacadeImpl::addDataset() invalid ID! - id=${id}; kind=${kind}`);
	}
}
