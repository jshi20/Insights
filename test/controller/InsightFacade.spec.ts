import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";
//import * as fs from "fs-extra";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
//import * as queryInterfaces from "../../src/controller/Query";
//import * as queryMethods from "../../src/controller/queryMethods";
//import * as add from "../../src/controller/addStuff";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let smallSec: string;
	let broken: string;
	let empty: string;
	let emptySection: string;
	let vFile: string;
	let invalidJson: string;
	let sixBuilding: string;
	let invalidAddressAll: string;
	let wrongIndexName: string;
	let noTableIndex: string;
	let onlyESBInvalidAddress: string;
	let noTableDataElementWithViewsField: string;
	let noValidTableIndex: string;
	let multipleTablesOneValid: string;
	let emptyPaths: string;
	let onePath: string;
	let buildingFileNoTable: string;
	let campus: string;

	before(async function () {
		// This block runs once and loads the datasets.
		// campus = await getContentFromArchives("campus.zip");
		sections = await getContentFromArchives("pair.zip");
		smallSec = await getContentFromArchives("smallPair.zip");
		//broken = await getContentFromArchives("broken.zip");
		emptySection = await getContentFromArchives("emptySection.zip");
		vFile = await getContentFromArchives("ValidFileNoZip");
		invalidJson = await getContentFromArchives("invalidJson.zip");
		sixBuilding = await getContentFromArchives("SixCampus.zip");
		invalidAddressAll = await getContentFromArchives("invalidAddress.zip");
		wrongIndexName = await getContentFromArchives("wrongIndexName.zip");
		noTableIndex = await getContentFromArchives("noTableIndex.zip");
		onlyESBInvalidAddress = await getContentFromArchives("onlyESBInvalidAddress.zip");
		noTableDataElementWithViewsField = await getContentFromArchives("noTableDataElementWithViewsField.zip");
		noValidTableIndex = await getContentFromArchives("noValidTableIndex.zip");
		multipleTablesOneValid = await getContentFromArchives("multipleTablesOneValid.zip");
		emptyPaths = await getContentFromArchives("emptyPaths.zip");
		onePath = await getContentFromArchives("onePath.zip");
		buildingFileNoTable = await getContentFromArchives("buildingFileNoTable.zip");
		campus = await getContentFromArchives("campus.zip");
		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		describe("all addDataset tests for rooms", function () {
			it("should not throw, because given campus dataset is valid", async function () {
				try {
					const result = await facade.addDataset("campus", campus, InsightDatasetKind.Rooms);
					expect(result[0]).to.deep.equal("campus");
				} catch (err) {
					expect.fail("Should not throw err; campus is valid " + err);
				}
			});
			it("should throw because building file no table, only one building", async function () {
				try {
					await facade.addDataset("buildingFileNoTable", buildingFileNoTable, InsightDatasetKind.Rooms);
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should throw since how can sections data be parsed as rooms", async function () {
				try {
					await facade.addDataset("section", sections, InsightDatasetKind.Rooms);
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should throw since how can rooms data be parsed as sections", async function () {
				try {
					await facade.addDataset("onePath", onePath, InsightDatasetKind.Sections);
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should not throw, because atleast ESB file still in campus", async function () {
				try {
					const result = await facade.addDataset("onePath", onePath, InsightDatasetKind.Rooms);
					expect(result[0]).to.deep.equal("onePath");
				} catch (err) {
					expect.fail("Should not throw err because atleast ESB.htm exists " + err);
				}
			});

			it("should throw, because no building data file in campus", async function () {
				try {
					await facade.addDataset("emptyPaths", emptyPaths, InsightDatasetKind.Rooms);
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should pass, index.htm has multiple but 1 valid <table>", async function () {
				try {
					const result = await facade.addDataset(
						"multipleTablesOneValid",
						multipleTablesOneValid,
						InsightDatasetKind.Rooms
					);
					expect(result[0]).to.deep.equal("multipleTablesOneValid");
				} catch (err) {
					expect.fail("Should not throw err, perfectly valid " + err);
				}
			});

			it("should throw, becuase no VALID table in index.htm", async function () {
				try {
					await facade.addDataset("noValidTableIndex", noValidTableIndex, InsightDatasetKind.Rooms);
					expect.fail("Should throw err because no valid table in index.htm");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should pass, even tho no td element with explicit views-field class", async function () {
				try {
					const result = await facade.addDataset(
						"noTableDataElementWithViewsField",
						noTableDataElementWithViewsField,
						InsightDatasetKind.Rooms
					);
					expect(result[0]).to.deep.equal("noTableDataElementWithViewsField");
				} catch (err) {
					expect.fail("Should not throw err, perfectly valid " + err);
				}
			});

			it("should not throw since other valid rooms, only ESB invalid", async function () {
				try {
					const result = await facade.addDataset(
						"onlyESBInvalidAddress",
						onlyESBInvalidAddress,
						InsightDatasetKind.Rooms
					);
					expect(result[0]).to.deep.equal("onlyESBInvalidAddress");
				} catch (err) {
					expect.fail("Should not throw err, add rooms building test " + err);
				}
			});

			it("should throw, becuase no table in index.htm", async function () {
				try {
					await facade.addDataset("noTable", noTableIndex, InsightDatasetKind.Rooms);
					expect.fail("Should throw err because no <table> in index.htm");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should throw, becuase no valid index.htm name", async function () {
				try {
					await facade.addDataset("inva", wrongIndexName, InsightDatasetKind.Rooms);
					expect.fail("Should throw err because no valid index.htm");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should throw, since no valid rooms due to invalid addy meaning invalid lat + lon for all rooms", async function () {
				try {
					await facade.addDataset("inva", invalidAddressAll, InsightDatasetKind.Rooms);
					expect.fail("Should throw err because no valid rooms");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("test run to see what addDataset produces for rooms so far", async function () {
				try {
					const result = await facade.addDataset("SixBuildingTest", sixBuilding, InsightDatasetKind.Rooms);
					expect(result[0]).to.deep.equal("SixBuildingTest");
				} catch (err) {
					expect.fail("Should not throw err, add rooms building test " + err);
				}
			});
		});

		it("should reject since only 1 file and is invalid json", async function () {
			try {
				await facade.addDataset("invalidJson", invalidJson, InsightDatasetKind.Sections);
				expect.fail("Should throw err, invalid json");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject since file is not zipped; add", async function () {
			try {
				await facade.addDataset("vFil", vFile, InsightDatasetKind.Sections);
				expect.fail("Should throw err, vF");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject since contains 0 valid sections; add", async function () {
			try {
				await facade.addDataset("emptySec", emptySection, InsightDatasetKind.Sections);
				expect.fail("Should throw err, sec is empty add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject since content is broken; add", async function () {
			try {
				await facade.addDataset("broken", broken, InsightDatasetKind.Sections);
				expect.fail("Should throw err because broken, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with empty dataset id for addDataset", async function () {
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Sections);
				expect.fail("Should throw err because id is empty, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset with underscore in id for addDataset", async function () {
			try {
				await facade.addDataset("_", smallSec, InsightDatasetKind.Sections);
				expect.fail("Should throw err because id has underscore, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset with only whitespace in id for addDataset", async function () {
			try {
				await facade.addDataset("	", smallSec, InsightDatasetKind.Sections);
				expect.fail("Should throw err because id is only whitespace, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should add dataset with space in id for addDataset, 1 0 is valid", async function () {
			try {
				await facade.addDataset("1 0", smallSec, InsightDatasetKind.Sections);
			} catch (err) {
				expect.fail("Should not throw err because id 1 0 is valid, add" + err);
			}
		});

		it("should reject dataset because ID myDupe is a duplicate", async function () {
			try {
				await facade.addDataset("myDupe", sections, InsightDatasetKind.Sections);
				await facade.addDataset("myDupe", sections, InsightDatasetKind.Sections);
				expect.fail("Should throw err because adding ID duplicate dataSet, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject because ID myDupe is a duplicate, even tho diff data; add", async function () {
			try {
				await facade.addDataset("duped", smallSec, InsightDatasetKind.Sections);
				await facade.addDataset("duped", sections, InsightDatasetKind.Sections);
				expect.fail("Should throw err because adding ID duplicate dataSet, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject since kind is invalid; add", async function () {
			try {
				const invalidEnum: any = "broke";
				await facade.addDataset("broken", smallSec, invalidEnum);
				expect.fail("Should throw err because adding ID duplicate dataSet, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should add ID smallpair dataset since it is valid", async function () {
			try {
				const result = await facade.addDataset("smallpair", smallSec, InsightDatasetKind.Sections);
				expect(result[0]).to.deep.equal("smallpair");
			} catch (err) {
				expect.fail("Should not throw err, smallPair" + err);
			}
		});

		it("should succesfully add 2 datasets, smallpair and bigpair, add", async function () {
			try {
				await facade.addDataset("smallpair", smallSec, InsightDatasetKind.Sections);

				const result = await facade.addDataset("bigpair", sections, InsightDatasetKind.Sections);
				const myExpectedLength = 2;
				expect(result.length).to.equal(myExpectedLength);
				expect(result).to.contain("smallpair");
				expect(result).to.contain("bigpair");
			} catch (err) {
				expect.fail("Should not throw err, smallPair" + err);
			}
		});

		it("should reject since content is empty; add", async function () {
			try {
				await facade.addDataset("broken", empty, InsightDatasetKind.Sections);
				expect.fail("Should throw err because unZipped, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject since content is invalid base64 string; add", async function () {
			try {
				await facade.addDataset("broken", "INVALIDBASE64STRING", InsightDatasetKind.Sections);
				expect.fail("Should throw err because invalid base64 string, add");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});
		it("should reject with  an empty dataset id for removeDataset", async function () {
			try {
				await facade.removeDataset("");
				expect.fail("Should throw err because id is empty, remove");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset with underscore in id for removeDataset", async function () {
			try {
				await facade.removeDataset("_");
				expect.fail("Should throw err because id has underscore, remove");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset with only whitespace (tab) for removeDataset", async function () {
			try {
				await facade.removeDataset("	");
				expect.fail("Should throw err because id has space, remove");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should throw err because id 11 dataset DNE", async function () {
			try {
				await facade.removeDataset("11");
				expect.fail("id 11 dataset DNE, cannot remove");
			} catch (err) {
				//Pass because it is id 11 dataset DNE
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should remove sections DataSet since it is added", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				const result = await facade.removeDataset("sections");
				expect(result).to.deep.equal("sections");
			} catch (err) {
				expect.fail("sections dataset can be removed, unexpected err" + err);
			}
		});

		it("should remove sixBuilding DataSet since it is added", async function () {
			try {
				await facade.addDataset("sixBuilding", sixBuilding, InsightDatasetKind.Rooms);
				const result = await facade.removeDataset("sixBuilding");
				expect(result).to.deep.equal("sixBuilding");
			} catch (err) {
				expect.fail("sixBuilding dataset can be removed, unexpected err" + err);
			}
		});

		it("should fail since remove sections has been done; remove", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("sections");
				await facade.removeDataset("sections"); //already removed
				expect.fail("sections dataset already removed, need throw err; remove");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});
	});

	// describe("interface validation", function () {
	// 	it("MComparison: GT", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/GT.json`, "utf-8");
	// 		const testQuery: queryInterfaces.MComparison = JSON.parse(data);
	// 		if (testQuery.EQ) {
	// 			expect.fail("EQ should not be populated");
	// 		}
	// 		if (testQuery.GT && queryMethods.isMComparison(testQuery)) {
	// 			expect(true);
	// 		}
	// 	});

	// 	it("MComparison: LT", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/LT.json`, "utf-8");
	// 			const testQuery: queryInterfaces.MComparison = JSON.parse(data);
	// 			if (testQuery.EQ) {
	// 				expect.fail("EQ should not be populated");
	// 			}
	// 			if (testQuery.LT && queryMethods.isMComparison(testQuery)) {
	// 				expect(true);
	// 			}
	// 		} catch (err) {
	// 			if (err instanceof InsightError) {
	// 				expect.fail(err.message);
	// 			}
	// 		}
	// 	});

	// 	it("LogigicalOperator: AND", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/AND.json`, "utf-8");
	// 		const testQuery: queryInterfaces.LogicComparison = JSON.parse(data);

	// 		try {
	// 			if (queryMethods.isLogicComparison(testQuery)) {
	// 				expect(true);
	// 			} else {
	// 				expect.fail("logical operator wasnt parsed correctly");
	// 			}
	// 		} catch (error) {
	// 			if (error instanceof InsightError) {
	// 				expect.fail(error.message);
	// 			}
	// 		}
	// 	});

	// 	it("SOpterator", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/SCOMP.json`, "utf-8");
	// 		const testQuery: queryInterfaces.SComparison = JSON.parse(data);
	// 		try {
	// 			if (queryMethods.isSComparison(testQuery)) {
	// 				expect(true);
	// 			}
	// 		} catch (error) {
	// 			if (error instanceof InsightError) {
	// 				expect.fail("Failed to read Sopter: " + error.message);
	// 			}
	// 		}
	// 	});

	// 	it("isNegation", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/NEGATION.json`, "utf-8");
	// 		const testQuery: queryInterfaces.Negation = JSON.parse(data);
	// 		try {
	// 			if (queryMethods.isNegation(testQuery)) {
	// 				expect(true);
	// 			}
	// 		} catch (error) {
	// 			if (error instanceof InsightError) {
	// 				expect.fail("Failed to read Negation: " + error.message);
	// 			}
	// 			expect.fail();
	// 		}
	// 	});

	// 	it("WHERE", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/WHERE.json`, "utf-8");
	// 		const testQuery: queryInterfaces.Query = JSON.parse(data);
	// 		try {
	// 			if (queryMethods.isWhere(testQuery.WHERE)) {
	// 				expect(true);
	// 			} else {
	// 				expect.fail();
	// 			}
	// 		} catch (error) {
	// 			if (error instanceof InsightError) {
	// 				expect.fail("Failed to read WHERE: " + error.message);
	// 			}
	// 			expect.fail();
	// 		}
	// 	});

	// 	it("empty WHERE", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/emptyWHERE.json`, "utf-8");
	// 		const testQuery: queryInterfaces.Query = JSON.parse(data);
	// 		try {
	// 			if (queryMethods.isWhere(testQuery.WHERE)) {
	// 				expect(true);
	// 			} else {
	// 				expect.fail("Where was not a filter: " + testQuery);
	// 			}
	// 		} catch (error) {
	// 			if (error instanceof InsightError) {
	// 				expect.fail("Failed to read empty WHERE: " + error.message);
	// 			}
	// 			expect.fail();
	// 		}
	// 	});

	// 	it("Options", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/OPTIONS.json`, "utf-8");
	// 		const testQuery: queryInterfaces.Options = JSON.parse(data);
	// 		try {
	// 			if (queryMethods.isOptions(testQuery)) {
	// 				expect(true);
	// 			} else {
	// 				expect.fail("Could not read options");
	// 			}
	// 		} catch (error) {
	// 			if (error instanceof InsightError) {
	// 				expect.fail("Failed to read Options: " + error.message);
	// 			}
	// 			expect.fail();
	// 		}
	// 	});

	// 	it("Full query", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/FULL.json`, "utf-8");
	// 		const testQuery: queryInterfaces.Query = JSON.parse(data);
	// 		try {
	// 			if (queryMethods.isQuery(testQuery)) {
	// 				return true;
	// 			}
	// 		} catch (error) {
	// 			if (error instanceof InsightError) {
	// 				expect.fail("Failed to read Full querry: " + error.message);
	// 			}
	// 			expect.fail();
	// 		}
	// 	});

	// 	it("GetNameTest", async function () {
	// 		const data = await fs.readFile(`test/resources/queries/interfaceTests/FULL.json`, "utf-8");
	// 		const testQuery: queryInterfaces.Query = JSON.parse(data);
	// 		const title = queryMethods.getName(testQuery);
	// 		expect(title).to.equal("sections");
	// 	});
	// 	it("getDBtest", async function () {
	// 		const db = queryMethods.getDB("oneCourse");
	// 		expect((await db).allSections[0].title).to.equal("fnc hmn ant musc");
	// 	});

	// 	it("mcQuery", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/LT2.json`, "utf-8");
	// 			const testQuery: queryInterfaces.MComparison = JSON.parse(data);

	// 			const db = queryMethods.getDB("oneCourse");
	// 			const answer = queryMethods.mComparisonQuery(testQuery, (await db).allSections, "oneCourse");

	// 			const tidySection: add.TidySection = {
	// 				uuid: "18518",
	// 				id: "515",
	// 				title: "fnc hmn ant musc",
	// 				instructor: "ford, donna",
	// 				dept: "anat",
	// 				year: 2009,
	// 				avg: 95,
	// 				pass: 7,
	// 				fail: 0,
	// 				audit: 0,
	// 			};

	// 			expect(answer).to.deep.equal(tidySection);
	// 		} catch (err) {
	// 			if (err instanceof InsightError) {
	// 				expect.fail(err.message + "uhoh s");
	// 			}
	// 		}
	// 	});

	// 	it("mcQueryFail", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/LT.json`, "utf-8");
	// 			const testQuery: queryInterfaces.MComparison = JSON.parse(data);

	// 			const db = queryMethods.getDB("oneCourse");
	// 			queryMethods.mComparisonQuery(testQuery, (await db).allSections, "oneCourse");

	// 			expect.fail();
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});

	// 	it("sQuery", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/SCOMP2.json`, "utf-8");
	// 			const testQuery: queryInterfaces.SComparison = JSON.parse(data);

	// 			const db = queryMethods.getDB("oneCourse");
	// 			const answer = queryMethods.sComparisonQuery(testQuery, (await db).allSections, "oneCourse");

	// 			const tidySection: add.TidySection = {
	// 				uuid: "18518",
	// 				id: "515",
	// 				title: "fnc hmn ant musc",
	// 				instructor: "ford, donna",
	// 				dept: "anat",
	// 				year: 2009,
	// 				avg: 95,
	// 				pass: 7,
	// 				fail: 0,
	// 				audit: 0,
	// 			};

	// 			expect(answer).to.deep.equal(tidySection);
	// 		} catch (err) {
	// 			if (err instanceof InsightError) {
	// 				expect.fail(err.message + "uhoh s");
	// 			}
	// 		}
	// 	});

	// 	it("sQuery fails", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/SCOMP.json`, "utf-8");
	// 			const testQuery: queryInterfaces.SComparison = JSON.parse(data);

	// 			const db = queryMethods.getDB("oneCourse");
	// 			queryMethods.sComparisonQuery(testQuery, (await db).allSections, "oneCourse");

	// 			expect.fail();
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});

	// 	it("notQuery", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/NEGATION2.json`, "utf-8");
	// 			const testQuery: queryInterfaces.Negation = JSON.parse(data);

	// 			const db = queryMethods.getDB("oneCourse");
	// 			const answer = queryMethods.logicalQuery(testQuery, (await db).allSections, "oneCourse");

	// 			const tidySection: add.TidySection = {
	// 				uuid: "18518",
	// 				id: "515",
	// 				title: "fnc hmn ant musc",
	// 				instructor: "ford, donna",
	// 				dept: "anat",
	// 				year: 2009,
	// 				avg: 95,
	// 				pass: 7,
	// 				fail: 0,
	// 				audit: 0,
	// 			};

	// 			expect(answer).to.deep.equal(tidySection);
	// 		} catch (err) {
	// 			if (err instanceof InsightError) {
	// 				expect.fail(err.message + "uhoh s");
	// 			}
	// 		}
	// 	});

	// 	it("orQuery", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/OR2.json`, "utf-8");
	// 			const testQuery: queryInterfaces.LogicComparison = JSON.parse(data);

	// 			const db = queryMethods.getDB("oneCourse");
	// 			const answer = queryMethods.logicalQuery(testQuery, (await db).allSections, "oneCourse");

	// 			const tidySection: add.TidySection = {
	// 				uuid: "18518",
	// 				id: "515",
	// 				title: "fnc hmn ant musc",
	// 				instructor: "ford, donna",
	// 				dept: "anat",
	// 				year: 2009,
	// 				avg: 95,
	// 				pass: 7,
	// 				fail: 0,
	// 				audit: 0,
	// 			};

	// 			expect(answer[0]).to.deep.equal(tidySection);
	// 		} catch (err) {
	// 			if (err instanceof Error) {
	// 				expect.fail(err.message + "uhoh s");
	// 			}
	// 			expect.fail();
	// 		}
	// 	});

	// 	it("andQuery", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/AND2.json`, "utf-8");
	// 			const testQuery: queryInterfaces.LogicComparison = JSON.parse(data);

	// 			const db = queryMethods.getDB("oneCourse");
	// 			const answer = queryMethods.logicalQuery(testQuery, (await db).allSections, "oneCourse");

	// 			const tidySection: add.TidySection = {
	// 				uuid: "18518",
	// 				id: "515",
	// 				title: "fnc hmn ant musc",
	// 				instructor: "ford, donna",
	// 				dept: "anat",
	// 				year: 2009,
	// 				avg: 95,
	// 				pass: 7,
	// 				fail: 0,
	// 				audit: 0,
	// 			};

	// 			expect(answer[0]).to.deep.equal(tidySection);
	// 			expect(answer.length).to.equal(1);
	// 		} catch (err) {
	// 			if (err instanceof Error) {
	// 				expect.fail(err.message + "uhoh s");
	// 			}
	// 			expect.fail();
	// 		}
	// 	});

	// 	//need an isquery

	// 	it("options", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/OPTIONS2.json`, "utf-8");
	// 			const testQuery: queryInterfaces.Options = JSON.parse(data);

	// 			const db = await queryMethods.getDB("oneCourse");

	// 			const answer = queryMethods.optionsQuery(testQuery, db.allSections, "oneCourse");

	// 			expect(answer[0].id).to.equal("515");
	// 		} catch (err) {
	// 			if (err instanceof Error) {
	// 				expect.fail(err.message + "uhoh s");
	// 			}
	// 			expect.fail();
	// 		}
	// 	});

	// 	it("full query test", async function () {
	// 		try {
	// 			const data = await fs.readFile(`test/resources/queries/interfaceTests/FULL2.json`, "utf-8");
	// 			const testQuery: queryInterfaces.Query = JSON.parse(data);

	// 			const db = await queryMethods.getDB("oneCourse");

	// 			const answer = queryMethods.beginQuery(testQuery, db, "oneCourse");

	// 			expect.fail("answer is wrong: " + answer);
	// 		} catch (err) {
	// 			if (err instanceof Error) {
	// 				expect.fail(err.message + "uhoh s");
	// 			}
	// 			expect.fail();
	// 		}
	// 	});
	// });

	describe("ListDataset", function () {
		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});
		//should list all currently added datasets, their types, and number of rows
		it("should list only sections (one dataset) id, kind, and numRows", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				const result = await facade.listDatasets();
				expect(result).to.deep.equal([
					{
						id: "sections",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					},
				]);
			} catch (err) {
				expect.fail("listDataSet should not throw any errors" + err);
			}
		});

		it("should list rooms (one dataset) id, kind, and numRows", async function () {
			try {
				await facade.addDataset("sixBuilding", sixBuilding, InsightDatasetKind.Rooms);
				const result = await facade.listDatasets();
				const ansRows = 29;
				expect(result[0].id).to.equal("sixBuilding");
				expect(result[0].kind).to.equal(InsightDatasetKind.Rooms);
				expect(result[0].numRows).to.equal(ansRows);
			} catch (err) {
				expect.fail("listDataSet should not throw any errors" + err);
			}
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[];
			try {
				result = await facade.performQuery(input);
				// console.log(result);
				// console.log(expected);
				expect(result).to.have.deep.members(expected);
			} catch (err) {
				//console.log(err);
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				//Reaching here means expected error is thrown

				//MUST explicitly test for which specific error is thrown
				if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceOf(ResultTooLargeError);
				} else if (expected === "InsightError") {
					expect(err).to.be.instanceOf(InsightError);
				}

				return; //Because expected an error to be thrown
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("SixCampus", sixBuilding, InsightDatasetKind.Rooms),
				facade.addDataset("rooms", campus, InsightDatasetKind.Rooms),
				//facade.addDataset("sectionsSmall", smallSec, InsightDatasetKind.Sections),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		it("[valid/basicNOT.json] Basic NOT test", checkQuery);

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);

		it("[valid/complex.json] SELECT dept, id, avg WHERE (avg == 95) OR (dept = adhe AND avg > 90)", checkQuery);
		it("[valid/WCLeft.json] SELECT dept, id, avg WHERE (avg == 420) OR (dept = *he AND avg > 92)", checkQuery);

		it("[valid/WCDouble.json] SELECT dept, id, avg WHERE (avg == 420) OR (dept = *on* AND avg > 93)", checkQuery);

		it("[valid/WCRight.json] SELECT dept, id, avg WHERE (avg == 420) OR (dept = *he AND avg > 92)", checkQuery);

		it("[invalid/WCMiddle.json] Asterisks (*) can only be the first or last characters of input strings", checkQuery);

		it("[invalid/WCTooMany.json] Too many Asterisks", checkQuery);

		it("[invalid/over5000Results.json] Over 5000 results", checkQuery);

		it("[valid/exactly5000.json] Got exactly 5000", checkQuery);

		it("[valid/LT.json] LT test", checkQuery);

		it("[valid/allColumn.json] List All Columns of LT", checkQuery);

		it("[valid/departmentTest.json] department zool", checkQuery);

		it("[valid/sFieldExceptTitle.json] sField test all except title", checkQuery);

		it("[valid/sFieldTitle.json] sField test title", checkQuery);

		it("[valid/mFieldExceptAuditANDYear.json] mField test avg, fail, pass", checkQuery);

		it("[valid/mFieldAuditANDYear.json] mField test audit, year", checkQuery);

		it("[invalid/invalidKeyTypeIS.json] Invalid keyType in IS", checkQuery);

		it("[invalid/invalidValueGT.json] Invalid value in GT, need be number", checkQuery);

		it("[invalid/invalidValueLT.json] Invalid value in LT, need be number", checkQuery);

		it("[invalid/invalidValueLT.json] Invalid value in EQ, need be number", checkQuery);

		it("[valid/GT.json] Basic GT test", checkQuery);

		it("[valid/EQ.json] Basic EQ test", checkQuery);

		it("[valid/bareNOT.json] bare bones not test", checkQuery);

		it("[invalid/invalidFilterKey.json] misspelt filter key", checkQuery);

		it("[invalid/invalidOrderCols.json] ORDER key must be in COLUMNS", checkQuery);

		it("[invalid/moreThanOneData.json] Cannot query more than one dataset", checkQuery);

		it("[invalid/mustBeObject.json] valid AND replaced with GT", checkQuery);

		it("[invalid/extraUnderscore.json] Invalid key sections__avg in GT", checkQuery);

		it("[invalid/onlyUnderscoreKey.json] Invalid key __avg in GT", checkQuery);

		it("[invalid/emptyArray.json] AND must be a non-empty array", checkQuery);

		it("[invalid/invalidArray.json] AND must be object", checkQuery);

		it("[invalid/invalidTypeIS.json] Invalid value type in IS, should be string", checkQuery);

		it("[invalid/emptyWhere.json] Query with WHERE giving over 5000", checkQuery);

		it("[invalid/emptyOr.json] OR must be a non-empty array, also NOT negation on empty", checkQuery);

		it("[invalid2/emptyColumns.json] columns is an empty string", checkQuery);
		it("[invalid2/emptyColumnsA.json] Columns has an array as one of its values", checkQuery);
		it("[invalid2/everyast2.json] starts with 2 *", checkQuery);
		it("[invalid2/invColKey.json] column key isnt a field in sections", checkQuery);
		it("[invalid2/orderNColumns.json] order key is not a column key", checkQuery);
		it("[invalid2/underline.json] ends with an underline", checkQuery);

		//C2 tests
		describe("Order tests", function () {
			//Ordring
			it("[valid/basicOrderingDown.json] ordering down on 1 key", checkQuery);
			it("[valid/orderingMultipleKeys.json] ordering with multiple keys", checkQuery);
			it("[invalid/emptyDir.json] empty dir value", checkQuery);
			it("[invalid/invalidDir.json] empty dir value", checkQuery);

			it("[invalid/emptyOrderArray.json] empty key array for ordering", checkQuery);
			it("[invalid/invalidMultiKeys.json] invalid key in key ordering array", checkQuery);
			it("[invalid/missingDir.json] missing dir", checkQuery);
			it("[invalid/missingOrderKeys.json] missing order key array", checkQuery);
		});
		describe("Group and Apply tests", function () {
			it("[valid/simpleTrans.json] simple transfromer", checkQuery);
			it("[valid/AVG.json] valid average operation", checkQuery);
			it("[valid/badApply.json] valid bad apply scenario", checkQuery);
			it("[valid/count.json] valid count operation", checkQuery);
			it("[valid/group.json] valid group operation", checkQuery);
			it("[valid/MIN.json] valid minimum operation", checkQuery);
			it("[valid/MAX.json] valid maximum operation", checkQuery);
			it("[valid/multiApply.json] valid multiple apply operations", checkQuery);
			it("[valid/SUM.json] valid sum operation", checkQuery);
			it("[valid/crazyAvg.json] valid 98+ avg", checkQuery);
			it("[valid/exMAX.json] valid max for seats > 300", checkQuery);
			it("[valid/big.json] valid big", checkQuery);

			//add max test

			it("[invalid/colKeyInApply.json] invalid column key in apply", checkQuery);
			it("[invalid/duplApplyKey.json] duplicate apply key", checkQuery);
			it("[invalid/emptyStringInApply.json] empty string in apply", checkQuery);
			it("[invalid/groupNonEmpty.json] group with non-empty field", checkQuery);
			it("[invalid/invalidColKeyEmptyApply.json] invalid column key with empty apply", checkQuery);
			it("[invalid/invalidMaxKey.json] invalid max key", checkQuery);
			it("[invalid/invalidSumKey.json] invalid sum key", checkQuery);
			it("[invalid/missingApply.json] missing apply", checkQuery);
			it("[invalid/missingApplyKey.json] missing apply key", checkQuery);
			it("[invalid/missingGroup.json] missing group", checkQuery);
			it("[invalid/multiApplyKey.json] multiple apply keys", checkQuery);
			it("[invalid/underscoreInApply.json] underscore in apply", checkQuery);
			it("[invalid/nonUnderscoreInGroup.json] underscore in group", checkQuery);
			it("[invalid/doubleUnderscoreInGroup.json] 2 underscore in group", checkQuery);
			it("[invalid2/stringMIN.json] trying to find min of non numeric dept", checkQuery);
			it("[invalid2/stringMAX.json] trying to find max of non numeric instructr", checkQuery);
			it("[invalid2/stringAVG.json] trying to find AVG of non numeric", checkQuery);
		});

		describe("TransormationTests", function () {
			it("[valid/complexQuery.json]", checkQuery);
			it("[valid/emptyResultQuery.json]", checkQuery);
			it("[valid/roomsAVG.json]", checkQuery);
			it("[valid/roomsCount.json]", checkQuery);
			it("[valid/roomsMAX.json]", checkQuery);
			it("[valid/roomsMIN.json]", checkQuery);
			it("[valid/roomsSum.json]", checkQuery);
			it("[valid/wildcardQuery.json]", checkQuery);
			it("[valid/boo.json]", checkQuery);
		});
	});
});
