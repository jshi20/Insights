import {
	IInsightFacade,
	InsightError,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	ResultTooLargeError,
	NotFoundError,
} from "./IInsightFacade";
import { Query } from "./Query";

import * as queryMethods from "./queryMethods";
import * as isLogicComparison from "./queryValidation";
import * as addStuff from "./addStuff";
import * as addRooms from "./addRooms";
import * as fs from "fs-extra";
import { isTidyRoomDataset } from "./addRoomsTypes";
const TOOLARGENUM = 5000;

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let rawData: any;
		let tidyData: any;

		// //Check if valid kind
		// if (!Object.values(InsightDatasetKind).includes(kind)) {
		// 	throw new InsightError("invalid kind in addDataset");
		// }

		// //Check that id given is not duplicate
		// const path = addStuff.pathGivenID(id);
		// await fs.pathExists(path).then(function (exist) {
		// 	if (exist) {
		// 		throw new InsightError("Duplicate ID not allowed");
		// 	}
		// });

		// //Check if validID, if not throw
		// if (!addStuff.isValidID(id)) {
		// 	throw new InsightError(
		// 		`InsightFacadeImpl::addDataset() invalid ID! - id=${id}; content=${content?.length}; kind=${kind}`
		// 	);
		// }

		try {
			await addStuff.checkIDPathKind(id, kind);
		} catch (err) {
			throw new InsightError(`${err}`);
		}

		if (InsightDatasetKind.Rooms === kind) {
			try {
				await addRooms.handleRoomsB64(content, id);
			} catch (err) {
				throw new InsightError(`Could not handleRoomsB64 ${err}`);
			}
		} else {
			//First, unzip and get the JSON objects
			try {
				rawData = await addStuff.turnB64ToJsonObjects(content);
			} catch (err) {
				throw new InsightError("transforming from B64 to JSON err:" + err);
			}

			//Second, tidy the data
			try {
				tidyData = addStuff.RawCoursetoTidySections(rawData);
			} catch {
				throw new InsightError("probably TidySection[] == 0");
			}

			//Third, add data to a new .json file and add save to disk
			// try {
			await addStuff.toDataFolder(tidyData, id);
			// } catch {
			// 	throw new InsightError("error adding data to folder, in addDataset");
			// }
		}

		//Now read all files in ./data and remove extension and return
		const ans = await fs.readdir("./data");

		const parsed = ans.map(function (file: string) {
			return addStuff.removeExtension(file);
		});

		return parsed;
	}

	public async removeDataset(id: string): Promise<string> {
		if (!addStuff.isValidID(id)) {
			throw new InsightError(`trying to remove invalid ID - id=${id};`);
		}

		const path: string = addStuff.pathGivenID(id);
		const exist: boolean = await fs.pathExists(path);

		if (exist) {
			await fs.remove(path);
		} else {
			throw new NotFoundError("dataset " + id + " to remove not found");
		}

		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		//checks for query being an object
		if (typeof query !== "object" || query === null) {
			throw new InsightError("query is not an object");
		}
		try {
			//validates query
			isLogicComparison.isQuery(query);
		} catch (err) {
			throw new InsightError("Query is not valid: " + err);
		}

		//establish query and DB name
		const pQuery: Query = query as Query;
		let name;
		try {
			name = queryMethods.getName(pQuery);
		} catch {
			throw new InsightError("Error getting name");
		}

		//retrieve database
		let database;
		try {
			database = await queryMethods.getDB(name);
		} catch (err) {
			throw new InsightError("Error getting dbname: " + err);
		}

		const results = queryMethods.beginQuery(pQuery, database, name);

		if (results.length > TOOLARGENUM) {
			throw new ResultTooLargeError("Result is too large");
		}

		return results;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const ans: InsightDataset[] = [];
		try {
			//./data might not exist yet, so readdir(./data) will reject if DNE, at that point return []
			const allFiles = await fs.readdir("./data");

			const myPromises = allFiles.map(async function (file) {
				const filePath = "./data/" + file;
				const fileData = await fs.readJson(filePath);
				let myKind = InsightDatasetKind.Sections;
				let myNumRows = 0;
				if (isTidyRoomDataset(fileData)) {
					myKind = InsightDatasetKind.Rooms;
					myNumRows = fileData.Rooms.length;
				} else {
					myNumRows = fileData.allSections.length;
				}
				ans.push({
					id: addStuff.removeExtension(file),
					kind: myKind,
					numRows: myNumRows,
				});
			});

			await Promise.all(myPromises);
		} catch {
			return ans;
		}

		return ans;
	}
}
