import Decimal from "decimal.js";

export interface Query {
	WHERE: Filter;
	OPTIONS: Options;
	TRANSFORMATIONS?: Transformations;
}

export type Filter = LogicComparison | MComparison | SComparison | Negation | {};

export interface LogicComparison {
	AND?: Filter[];
	OR?: Filter[];
}

export interface MComparison {
	LT?: Record<string, number | Decimal>;
	GT?: Record<string, number | Decimal>;
	EQ?: Record<string, number | Decimal>;
}

export interface SComparison {
	IS: Record<string, string>;
}

export interface Negation {
	NOT: Filter;
}

export interface Options {
	COLUMNS: string[];
	ORDER?: { dir: "UP" | "DOWN"; keys: ANYKEY[] } | ANYKEY;
}

export interface Transformations {
	GROUP: ANYKEY[];
	APPLY: ApplyRule[];
}
export type ANYKEY = Key | string;

export interface ApplyRule extends Record<string, Record<ApplyToken, Key>> {}

//sections
export type MField = "avg" | "pass" | "fail" | "audit" | "year";
export type SField = "dept" | "id" | "instructor" | "title" | "uuid";
export const KEYVALUES: string[] = [
	"avg",
	"pass",
	"fail",
	"audit",
	"year",
	"dept",
	"id",
	"instructor",
	"title",
	"uuid",
	"lat",
	"lon",
	"seats",
	"fullname",
	"shortname",
	"number",
	"name",
	"address",
	"type",
	"furniture",
	"href",
];
export const MKEYVALUES = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];

export type ApplyToken = "MAX" | "MIN" | "AVG" | "COUNT" | "SUM";
export type Key = SField | MField;

//rooms
export type RoomMField = "lat" | "lon" | "seats";
export type RoomSField = "fullname" | "shortname" | "number" | "name" | "address" | "type" | "furniture" | "href";
