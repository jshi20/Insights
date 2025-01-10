import * as JSZip from "jszip";
import * as fs from "fs-extra";
import * as parse5 from "parse5";
import * as addStuff from "./addStuff";
import { isBooleanObject } from "util/types";
import * as http from "http";
import * as rt from "./addRoomsTypes";

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
export async function toDataFolderRoom(data: rt.BuildingInformation[] | rt.TidyRoom[], id: string): Promise<void> {
	if (data.length <= 0) {
		throw new Error("data array has length 0, doesnt make sense");
	}

	//let toAdd: rt.BuildingInfoEx | rt.TidyRoomDataset;

	//Furniture DNE in BuildingInformation[];
	// if ("furniture" in data[0]) {
	// 	data = data as rt.TidyRoom[];
	// 	toAdd = {
	// 		Rooms: data,
	// 	};
	// } else {
	// 	data = data as rt.BuildingInformation[];
	// 	toAdd = {
	// 		Building: data,
	// 	};
	// }

	data = data as rt.TidyRoom[];
	const toAdd = {
		Rooms: data,
	};
	const path: string = addStuff.pathGivenID(id);
	await fs.outputJson(path, toAdd);
}

/**
 * BEHAVIOUR: Take data, if valid table return itself, otherwise return false (can be T/F)
 *
 * @param data: Parse5Output
 * @return itself if has valid table, otherwise false
 */
export function hasValidTable(data: rt.Parse5Output): boolean | rt.Parse5Output {
	const validIndexTable: rt.Parse5Output | null = getValidOnNameParse5(data, "table", "views-field");

	if (validIndexTable === null) {
		return false;
	}

	return validIndexTable;
}

/**
 * BEHAVIOUR: Take the index.htm which is not a Parse5Output, parse info and return if valid
 *
 * @param index Parse5Output
 * @return BuildInformation[] which contains all valid BuildingInfo. objects
 */
export function getAllBuildingInformation(index: rt.Parse5Output): rt.BuildingInformation[] {
	const validIndexTable: rt.Parse5Output | boolean = hasValidTable(index);

	if (isBooleanObject(validIndexTable) || !validIndexTable) {
		throw new Error("invalid index.htm file because no valid table");
	}

	//let allBuildingInformation: rt.BuildingInformation[];
	//try {
	const allBuildingInformation: rt.BuildingInformation[] = parseValidTableIndex(validIndexTable);
	// } catch {
	// 	throw new Error("could not parse valid table index");
	// }

	return allBuildingInformation;
}

export async function handleRoomsB64(data: string, id: string): Promise<void> {
	const unZipped = await JSZip.loadAsync(data, { base64: true });

	let indexAsParse5: rt.Parse5Output | null = null; //stores the index.htm json tree file
	const restOfHtmFiles = new Map<string, rt.Parse5Output>(); //put rest into map, where key === path and value is json tree

	//Will need to store index base path, since need to replace restOfHtmFiles key as relative path w.r.t index.htm
	let indexBase = "";

	const myPromises = Object.keys(unZipped.files).map(async (filename) => {
		const file = unZipped.files[filename];
		try {
			const fileData = await file.async("string");
			//if (filename.endsWith("index.htm")) {
			if (filename === "index.htm") {
				indexAsParse5 = parse5.parse(fileData) as rt.Parse5Output;
				indexBase = filename.replace("index.htm", "");
			} else if (filename.endsWith(".htm")) {
				//path to itself is the key
				restOfHtmFiles.set(filename, parse5.parse(fileData) as rt.Parse5Output);
			}
		} catch {
			// Ignore parsing errors
		}
	});
	//Must wait for EVERYTHING to resolve/reject

	await Promise.all(myPromises);

	if (indexAsParse5 === null) {
		throw new Error("index CANNOT be null, invalid index.htm");
	}

	//Make a new map, replace each key value with relative key path wrt indexBase
	const relativePathsOfRestOfHtm = new Map<string, rt.Parse5Output>();
	for (const [fileName, fileData] of restOfHtmFiles) {
		const relativeBase = fileName.replace(indexBase, "./");
		relativePathsOfRestOfHtm.set(relativeBase, fileData);
	}

	const allBuildingInformation: rt.BuildingInformation[] = getAllBuildingInformation(indexAsParse5);

	//Now parse each BuildingInformation obj
	await parseBuildings(allBuildingInformation, relativePathsOfRestOfHtm, id);
}

/**
 * REQUIRE: BuildInformation[], all valid BuidlingInformation objects, should have a path to respective .htm file to rooms
 * BEHAVIOUR: Take all BuildingInformation objects, read their path,
 * then parse said .htm file @ path, then create all room objects and save them to disk with id, to ./data for tests otherwise for examples
 *
 * @param allBuildingInformation: BuildingInformation[]
 * @param id: string
 */
export async function parseBuildings(
	allBuildingInformation: rt.BuildingInformation[],
	setOfBuildingFiles: Map<string, rt.Parse5Output>,
	id: string
): Promise<void> {
	const allRooms: rt.TidyRoom[] = [];
	for (const building of allBuildingInformation) {
		const buildingFile = setOfBuildingFiles.get(building.pathToRooms);

		if (buildingFile !== undefined) {
			const validTable: rt.Parse5Output | boolean = hasValidTable(buildingFile);

			if (typeof validTable !== "boolean") {
				allRooms.push(...parseValidTableRooms(validTable, building));
			}
		}
	}

	//run through allRooms array, for each room run getGeolocationOnRoom on it and then return array of updated values
	await Promise.all(
		allRooms.map(async (room) => {
			await updateGeolocation(room);
		})
	);

	//need to run through each room object in allRoom to make sure all fields populated,
	//and remove all rooms with any unpopulated/invalid fields
	const cleanAllRooms: rt.TidyRoom[] = [];
	for (const room of allRooms) {
		if (addStuff.hasAllValidFields(room)) {
			cleanAllRooms.push(room);
		}
	}

	await toDataFolderRoom(cleanAllRooms, id);
}

export function parseValidTableRooms(data: rt.Parse5Output, building: rt.BuildingInformation): rt.TidyRoom[] {
	const ans: rt.TidyRoom[] = [];
	if (data?.childNodes) {
		for (const tBodyChild of data.childNodes) {
			if (tBodyChild.nodeName === "tbody") {
				if (tBodyChild?.childNodes) {
					for (const trChild of tBodyChild.childNodes) {
						if (trChild.nodeName === "tr") {
							const a: rt.TidyRoom = parseTableRowElementRooms(trChild, building);
							ans.push(a);
						}
					}
				}
			}
		}
	}
	return ans;
}

export function makeOneRoomBasedOnBuilding(building: rt.BuildingInformation): rt.TidyRoom {
	return {
		fullname: building.fullname,
		shortname: building.shortname,
		address: building.address,
		number: "",
		name: "",
		lat: -1,
		lon: -1,
		seats: -1,
		type: "",
		furniture: "",
		href: "",
	};
}

export function parseTableRowElementRooms(tRowEle: rt.Parse5Output, building: rt.BuildingInformation): rt.TidyRoom {
	const oneRoom = makeOneRoomBasedOnBuilding(building);

	if (tRowEle?.childNodes) {
		for (const tdChild of tRowEle.childNodes) {
			if (tdChild.attrs?.some((attr) => attr.value.includes("views-field-field-room-capacity"))) {
				oneRoom.seats = Number(parseTableDataElement(tdChild, ""));
			}

			if (tdChild.attrs?.some((attr) => attr.value.includes("views-field views-field-field-room-number"))) {
				oneRoom.number = parseTableDataElement(tdChild, "a Child");
				oneRoom.href = parseTableDataElement(tdChild, "a Attrs");
				oneRoom.name = oneRoom.shortname + "_" + oneRoom.number;
			}

			if (tdChild.attrs?.some((attr) => attr.value.includes("views-field-field-room-furniture"))) {
				oneRoom.furniture = parseTableDataElement(tdChild, "");
			}

			if (tdChild.attrs?.some((attr) => attr.value.includes("views-field-field-room-type"))) {
				oneRoom.type = parseTableDataElement(tdChild, "");
			}
		}
	}

	return oneRoom;
}

export async function updateGeolocation(myRoom: rt.TidyRoom): Promise<void> {
	try {
		const myGeo = await getGeolocation(myRoom);
		if (myGeo.lat && myGeo.lon) {
			myRoom.lat = myGeo.lat;
			myRoom.lon = myGeo.lon;
		}
	} catch {
		//probably ignore
	}
}

export async function getGeolocation(myRoom: rt.TidyRoom): Promise<rt.GeoResponse> {
	const encodeAddress = encodeURIComponent(myRoom.address);
	const completeUrl = rt.myUrl + encodeAddress;
	const goodStatCode = 200;

	return new Promise((resolve, reject) => {
		http
			.get(completeUrl, (response) => {
				let data = "";

				if (response.statusCode !== goodStatCode) {
					return reject(new Error(`req fail with code ${response.statusCode}`));
				}

				response.on("data", (chunk) => {
					data += chunk;
				});

				response.on("end", () => {
					const geoData: rt.GeoResponse = JSON.parse(data);

					if (geoData.error) {
						return reject(new Error(`Got error in geoData obj ${geoData.error}`)); //branch
					}
					resolve(geoData);
				});
			})
			.on("error", (err) => {
				reject(new Error("HTTP request error: " + err.message)); //branch
			});
	});
}

//CLEANS UP RETURN VALUE AS WELL
export function parseTableDataElement(tableDataElement: rt.Parse5Output, inWhere: string): string {
	if (inWhere === "" && tableDataElement?.childNodes) {
		for (const textChild of tableDataElement.childNodes) {
			if (textChild.nodeName === "#text" && textChild.value) {
				const ans = addStuff.removeSpace(textChild.value);
				if (ans) {
					return ans;
				}
			}
		}
	}

	if (inWhere.substring(0, 1) === "a" && tableDataElement?.childNodes) {
		for (const elementAChild of tableDataElement.childNodes) {
			if (elementAChild.nodeName === "a") {
				if (inWhere === "a Attrs" && elementAChild?.attrs) {
					for (const attrsEle of elementAChild.attrs) {
						if (attrsEle.name === "href") {
							return addStuff.removeSpace(attrsEle.value);
						}
					}
				} else if (inWhere === "a Child" && elementAChild?.childNodes) {
					for (const textChild of elementAChild.childNodes) {
						if (textChild.nodeName === "#text" && textChild.value) {
							const ans = addStuff.removeSpace(textChild.value);
							if (ans) {
								return ans;
							}
						}
					}
				}
			}
		}
	}

	return ""; //branch
}

export function parseTableRowElement(tableRowElement: rt.Parse5Output): rt.BuildingInformation {
	const oneBuildingInfo: rt.BuildingInformation = {
		fullname: "",
		shortname: "",
		address: "",
		pathToRooms: "",
	};

	if (tableRowElement?.childNodes) {
		for (const tdChild of tableRowElement.childNodes) {
			if (tdChild.attrs?.some((attr) => attr.value.includes("views-field-field-building-code"))) {
				oneBuildingInfo.shortname = parseTableDataElement(tdChild, "");
			}

			if (tdChild.attrs?.some((attr) => attr.value.includes("views-field-title"))) {
				oneBuildingInfo.fullname = parseTableDataElement(tdChild, "a Child");
				oneBuildingInfo.pathToRooms = parseTableDataElement(tdChild, "a Attrs");
			}

			if (tdChild.attrs?.some((attr) => attr.value.includes("views-field-field-building-address"))) {
				oneBuildingInfo.address = parseTableDataElement(tdChild, "");
			}
		}
	}

	return oneBuildingInfo;
}

// YOU WILL recieve a VALID table element of parse5
export function parseValidTableIndex(data: rt.Parse5Output): rt.BuildingInformation[] {
	//throw new Error(`complete this func. data=${data}`); //stub
	const ans: rt.BuildingInformation[] = [];
	if (data?.childNodes) {
		for (const tBodyChild of data.childNodes) {
			if (tBodyChild.nodeName === "tbody") {
				if (tBodyChild?.childNodes) {
					for (const trChild of tBodyChild.childNodes) {
						if (trChild.nodeName === "tr") {
							const a: rt.BuildingInformation = parseTableRowElement(trChild);
							ans.push(a);
						}
					}
				}
			}
		}
	}
	return ans;
}

export function checkValidClass(data: rt.Parse5Output, validClassName: string): Boolean {
	// if (validClassName === "") {
	// 	return true;
	// }

	if (data.nodeName === "table") {
		const res = getValidOnNameParse5(data, "td", "views-field");

		if (res) {
			return true;
		} else {
			return false;
		}
	}

	if (data.attrs?.some((attr) => attr.value.includes(validClassName))) {
		return true;
	}

	return false;
}

/**
 * REQUIRES: valid data? hopefully a valid nodeName and className
 * BEHAVIOUR: Returns a valid node specified by validNodeName and validClassName;
 * will check the node, then check all if its childNodes.
 * Special hardcoded validClassName for <table> elements. This function works with checkValidClass
 * to either return a specified valid node which is itself or one of its children, or null if DNE
 *
 * @param data
 * @param validNodeName
 * @param validClassName
 * @returns Parse5Output or null
 */
export function getValidOnNameParse5(
	data: rt.Parse5Output,
	validNodeName: string,
	validClassName: string
): rt.Parse5Output | null {
	if (data.nodeName === validNodeName && checkValidClass(data, validClassName)) {
		return data;
	}

	if (data.childNodes) {
		for (const childNode of data.childNodes) {
			const res = getValidOnNameParse5(childNode, validNodeName, validClassName);
			if (res) {
				return res;
			}
		}
	}

	return null; //Meaning no valid table
}
