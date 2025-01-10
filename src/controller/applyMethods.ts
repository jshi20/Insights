// applyMethods.ts
import Decimal from "decimal.js";
import { InsightResult } from "./IInsightFacade";
const FIX = 2;

export function getAvg(group: InsightResult[], applyKey: string, key: string): InsightResult {
	const curr: InsightResult = {};

	let total = new Decimal(0);
	// Step 1: Convert and add each value using Decimal
	for (const section of group) {
		total = total.add(new Decimal(section[key]));
	}

	// Step 2: Calculate average using toNumber() and regular division
	const avg = total.toNumber() / group.length;

	// Step 3: Round using toFixed(2) and convert back to number
	curr[applyKey] = Number(avg.toFixed(FIX));
	return curr;
}

export function getSum(group: InsightResult[], applyKey: string, key: string): InsightResult {
	const curr: InsightResult = {};

	let total = new Decimal(0);
	for (const section of group) {
		total = total.add(new Decimal(section[key]));
	}

	// Use toFixed(FIX) for SUM as specified
	curr[applyKey] = Number(total.toFixed(FIX));
	return curr;
}

// Other apply methods remain unchanged
export function getCount(group: InsightResult[], applyKey: string, key: string): InsightResult {
	const curr: InsightResult = {};
	const seen = new Set();
	for (const section of group) {
		seen.add(section[key]);
	}
	curr[applyKey] = seen.size;
	return curr;
}

export function getMin(group: InsightResult[], applyKey: string, key: string): InsightResult {
	const curr: InsightResult = {};

	let min = group[0][key];
	for (const section of group) {
		if (section[key] < min) {
			min = section[key];
		}
	}
	curr[applyKey] = min;
	return curr;
}

export function getMax(group: InsightResult[], applyKey: string, key: string): InsightResult {
	const curr: InsightResult = {};

	let max = group[0][key];
	for (const section of group) {
		if (section[key] > max) {
			max = section[key];
		}
	}
	curr[applyKey] = max;
	return curr;
}
