/**
 * FINAL ROOM STRUCTURE AND WHERE TO FIND THEIR RESPECTIVE VALUES
 * "rooms_fullname": index
 * "rooms_shortname":index
 * "rooms_number": room
 * "rooms_name": room & index; shortname + _ + number
 * "rooms_address":index
 * "rooms_lat":index; result from api using address
 * "rooms_lon":index; result from api using address
 * "rooms_seats": room
 * "rooms_type": room
 * "rooms_furniture": room
 * "rooms_href": room
 */
import { Tidy } from "./addStuff";

export interface BuildingInformation {
	fullname: string;
	shortname: string;
	address: string;
	pathToRooms: string;
}

export interface BuildingInfoEx {
	Building: BuildingInformation[];
}

export interface TidyRoom {
	fullname: string;
	shortname: string;
	number: string;
	name: string;
	address: string;
	lat: number;
	lon: number;
	seats: number;
	type: string;
	furniture: string;
	href: string;
}

export interface TidyRoomDataset extends Tidy {
	Rooms: TidyRoom[];
}

//Clear type
//type Parse5Output = ReturnType<typeof parse5.parse>;
export interface Parse5Output {
	nodeName: string;
	tagName?: string;
	attrs?: {
		name: string;
		value: string;
	}[];
	childNodes?: Parse5Output[];
	value?: string;
}

export interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export const myUrl = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team097/";

/**
 *
 * @param data is Tidy of addStuff.ts but can be anything...
 * @returns true if TidyRoomDataset, false otherwise
 */
export function isTidyRoomDataset(data: Tidy): boolean {
	return (data as TidyRoomDataset).Rooms !== undefined;
}
