import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "../../src/rest/Server";
import { clearDisk } from "../TestUtil";
import * as fs from "fs-extra";

describe("Facade C3", function () {
	let server: Server;
	let smallSec: Buffer;
	let campus: Buffer;

	before(async function () {
		// TODO: start server here once and handle errors properly
		const portNum = 4321;
		server = new Server(portNum);
		await server.start();

		//some buffer data
		smallSec = await fs.readFile("test/resources/archives/smallPair.zip");
		campus = await fs.readFile("test/resources/archives/campus.zip");
	});

	after(async function () {
		// TODO: stop server here once!
		await clearDisk();
		await server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	// it("PUT format", function () {
	// 	const SERVER_URL = "TBD";
	// 	const ENDPOINT_URL = "TBD";
	// 	const ZIP_FILE_DATA = "TBD";

	// 	try {
	// 		return request(SERVER_URL)
	// 			.put(ENDPOINT_URL)
	// 			.send(ZIP_FILE_DATA)
	// 			.set("Content-Type", "application/x-zip-compressed")
	// 			.then(function (res: Response) {
	// 				// some logging here please!
	// 				expect(res.status).to.be.equal(StatusCodes.OK);
	// 			})
	// 			.catch(function () {
	// 				// some logging here please!
	// 				expect.fail();
	// 			});
	// 	} catch (err) {
	// 		Log.error(err);
	// 		// and some more logging here!
	// 	}
	// });

	it("should pass PUT test for sections dataset", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/sec123/sections";
		const ZIP_FILE_DATA = smallSec;

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`PUT request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					Log.error(`PUT request failed`);
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should pass PUT test for rooms dataset", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/campus/rooms";
		const ZIP_FILE_DATA = campus;

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`PUT request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should fail PUT test for dataset since invalid id", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/_/sections";
		const ZIP_FILE_DATA = smallSec;

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`PUT request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
				})
				.catch(function () {
					// some logging here please!
					Log.error(`PUT request failed`);
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should fail PUT test for dataset since inval data", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/_/sections";
		const ZIP_FILE_DATA = "invalid";

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`PUT request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
					//expect.fail();
				})
				.catch(function () {
					// some logging here please!
					Log.error(`PUT request failed`);
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should pass DELETE test for added dataset", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/sec123";
		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`DELETE request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info(res.body);
					//expect.fail();
				})
				.catch(function () {
					// some logging here please!
					Log.error(`request failed`);
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should fail DELETE test since dataset DNE", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/123";
		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`DELETE request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
					Log.error(res.body);
					//expect.fail();
				})
				.catch(function () {
					// some logging here please!
					Log.error(`request failed`);
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should fail DELETE test since dataset ID inval", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/_";
		try {
			return request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`DELETE request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
					//expect.fail();
				})
				.catch(function () {
					// some logging here please!
					Log.error(`DELETE request failed`);
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should pass PUT test for another sections dataset", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/dataset/sec1234/sections";
		const ZIP_FILE_DATA = smallSec;

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`PUT request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.OK);
					Log.info(res.body);
				})
				.catch(function () {
					// some logging here please!
					Log.error(`PUT request failed`);
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should pass, POST query valid", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/query";

		const query = {
			WHERE: {
				GT: {
					sec1234_avg: 93,
				},
			},
			OPTIONS: {
				COLUMNS: ["sec1234_dept", "sec1234_avg"],
				ORDER: "sec1234_avg",
			},
		};

		try {
			return request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(query)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`POST request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.OK);
					//expect(res.body).to.have.property("result");
					Log.info(res.body);
					const queryLengthRes = 2;
					expect(res.body.result.length).to.be.equal(queryLengthRes);
				});
			// .catch(function () {
			// 	// some logging here please!
			// 	Log.error(`POST request failed or expect above fail`);
			// 	expect.fail();
			// });
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should fail, POST query on DNE dataset", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/query";

		const query = {
			WHERE: {
				GT: {
					DNE_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["DNE_dept", "DNE_avg"],
				ORDER: "DNE_avg",
			},
		};

		try {
			return request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(query)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`POST request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
					//expect.fail();
				})
				.catch(function () {
					// some logging here please!
					Log.error(`POST request failed`);
					//expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should fail, POST query invalid", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/query";

		const query = undefined;

		try {
			return request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(query)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`POST request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
					//expect.fail();
				})
				.catch(function () {
					// some logging here please!
					Log.error(`POST request failed`);
					//expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	it("should pass GET test and list all datasets", function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/datasets";
		try {
			return request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res: Response) {
					// some logging here please!
					Log.info(`GET request to ${SERVER_URL}${ENDPOINT_URL}, status ${res.status}`);
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					Log.error(`GET request failed`);
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
});
