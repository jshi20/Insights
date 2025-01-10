import { InsightError } from "./IInsightFacade";
import { Query, Filter, LogicComparison, MComparison, SComparison, Negation, Options, Transformations } from "./Query";

export function isQuery(obj: any): obj is Query {
	if (
		typeof obj === "object" &&
		obj !== null &&
		"WHERE" in obj &&
		"OPTIONS" in obj &&
		isFilter(obj.WHERE) &&
		isOptions(obj.OPTIONS)
	) {
		if (obj.TRANSFORMATIONS) {
			isTransformations(obj.TRANSFORMATIONS);
		}
		return true;
	}
	throw new InsightError("Error parsing " + obj + " in isQuery");
}

export function isFilter(obj: Filter): obj is Filter {
	if (isLogicComparison(obj)) {
		return true;
	}

	if (isMComparison(obj)) {
		return true;
	}

	if (isSComparison(obj)) {
		return true;
	}

	if (isNegation(obj)) {
		return true;
	}

	if (Object.keys(obj).length === 0) {
		return true;
	}

	throw new InsightError("Error parsing " + obj + " in isFilter");
}

export function isLogicComparison(obj: any): obj is LogicComparison {
	if (typeof obj === "object" && obj !== null && ("AND" in obj || "OR" in obj)) {
		for (const key in obj) {
			for (const logic in obj[key]) {
				isFilter(obj[key][logic]);
			}
		}
		return true;
	}
	return false;
}

export function isMComparison(obj: any): obj is MComparison {
	if (typeof obj === "object" && obj !== null && ("LT" in obj || "GT" in obj || "EQ" in obj)) {
		for (const key in obj) {
			if (!(typeof obj[key] === "object")) {
				throw new InsightError(obj[key] + " is not of type object ");
			}
			for (const section in obj[key]) {
				if (!(typeof obj[key][section] === "number")) {
					throw new InsightError(obj[key][section] + " is not of type number");
				}
			}
		}
		return true;
	}
	return false;
}

export function isSComparison(obj: any): obj is SComparison {
	if (typeof obj === "object" && obj !== null && "IS" in obj && typeof obj.IS === "object") {
		for (const key in obj) {
			if (!(typeof obj[key] === "object")) {
				throw new InsightError(obj[key] + " is not of type object ");
			}
			for (const section in obj[key]) {
				if (!(typeof obj[key][section] === "string")) {
					throw new InsightError(obj[key][section] + " is not of type string");
				}
			}
		}
		return true;
	}
	return false;
}

export function isNegation(obj: any): obj is Negation {
	if (typeof obj === "object" && obj !== null && "NOT" in obj) {
		if (!isFilter(obj.NOT)) {
			throw new InsightError(obj.NOT + " is not of type string");
		}

		return true;
	}
	return false;
}

export function isOptions(obj: any): obj is Options {
	if (typeof obj === "object" && obj !== null) {
		for (const key in obj) {
			if (key === "COLUMNS") {
				if (typeof obj.COLUMNS !== "object") {
					throw new InsightError(obj.COLUMN + " is not an object in isOptions");
				}
				for (const COLUMN in obj.COLUMNS) {
					if (typeof obj.COLUMNS[COLUMN] !== "string") {
						throw new InsightError(obj.COLUMN + " is not a string in isOptions");
					}
				}
			} else if (key === "ORDER") {
				if (typeof obj.ORDER === "object") {
					if (typeof obj.ORDER.dir !== "string") {
						throw new InsightError("Invalid type for ORDER direction");
					}
					const order = obj.ORDER;
					if (!order.keys || !Array.isArray(order.keys)) {
						throw new InsightError("Invalid keys in order");
					}
					if (!(Array.isArray(order.keys) && order.keys.length > 0)) {
						throw new InsightError("Options array must not be empty");
					}
				} else if (typeof obj.ORDER !== "string") {
					throw new InsightError("order " + obj.ORDER + " is not an string in isOptions");
				}
			} else {
				throw new InsightError(obj + " is not a COLUMNS or ORDER");
			}
		}
		return true;
	}
	throw new InsightError("Error parsing " + obj + " in isOptions");
}

export function isTransformations(obj: any): obj is Transformations {
	if (typeof obj === "object" && obj !== null && "GROUP" in obj && "APPLY" in obj) {
		basicTypeChecking(obj);

		for (const applyKey in obj.APPLY) {
			if (typeof applyKey === "string") {
				if (typeof obj.APPLY[applyKey] !== "object") {
					throw new InsightError("Apply Rule:" + obj.APPLY[applyKey] + " is not an object in isTranformation");
				}
				for (const rule in obj.APPLY[applyKey]) {
					if (typeof obj.APPLY[applyKey][rule] !== "object") {
						throw new InsightError("applyKey:" + obj.APPLY[applyKey][rule] + " is not an object in isTransformation");
					}

					for (const field in obj.APPLY[applyKey][rule]) {
						if (typeof obj.APPLY[applyKey][rule][field] !== "string") {
							throw new InsightError(
								"token or key:" + obj.APPLY[applyKey][rule][field] + " is not an object in isTransformation"
							);
						}
					}
					return true;
				}
			} else {
				throw new InsightError("appky key" + applyKey + " is not a string");
			}
		}
		return true;
	}
	throw new InsightError("Invalid query");
}
function basicTypeChecking(obj: any): void {
	if (typeof obj.GROUP !== "object" || !Array.isArray(obj.GROUP)) {
		throw new InsightError("GROUP in Transformations must be an array");
	}

	for (const key of obj.GROUP) {
		if (typeof key !== "string") {
			throw new InsightError("Invalid format for GROUP key: " + key);
		}
	}

	if (typeof obj.APPLY !== "object" || !Array.isArray(obj.APPLY)) {
		throw new InsightError("APPLY in Transformations must be an array");
	}
}
