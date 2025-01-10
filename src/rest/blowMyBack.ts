import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import InsightFacade from "../controller/InsightFacade";
import { InsightDatasetKind, NotFoundError } from "../controller/IInsightFacade";

export default class BlowMyBack {
	public async add(req: Request, res: Response): Promise<void> {
		const insight = new InsightFacade();

		try {
			const { id, kind } = req.params;
			const convertKind: InsightDatasetKind = kind as InsightDatasetKind;
			const b64Data = req.body.toString("base64");
			const stringArr = await insight.addDataset(id, b64Data, convertKind);
			res.status(StatusCodes.OK).json({ result: stringArr });
		} catch (err) {
			const e = err as Error;
			res.status(StatusCodes.BAD_REQUEST).json({ error: e.message });
		}
	}

	public async delete(req: Request, res: Response): Promise<void> {
		const insight = new InsightFacade();

		try {
			const { id } = req.params;
			const strAns = await insight.removeDataset(id);
			res.status(StatusCodes.OK).json({ result: strAns });
		} catch (err) {
			//removeDataset throws only NotFoundError or InsightError
			if (err instanceof NotFoundError) {
				res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
			} else {
				const e = err as Error;
				res.status(StatusCodes.BAD_REQUEST).json({ error: e.message });
			}
		}
	}

	public async query(req: Request, res: Response): Promise<void> {
		const insight = new InsightFacade();
		try {
			const query = req.body;
			const queryRes = await insight.performQuery(query);
			res.status(StatusCodes.OK).json({ result: queryRes });
		} catch (err) {
			const e = err as Error;
			res.status(StatusCodes.BAD_REQUEST).json({ error: e.message });
		}
	}

	public async list(req: Request, res: Response): Promise<void> {
		//NEED the req func. parameter or else express wont work and everything explodes
		//but I DONT need req, BUT if I dont use it linter complains; WTF?
		if (req.method) {
			const insight = new InsightFacade();
			const listArr = await insight.listDatasets();
			res.status(StatusCodes.OK).json({ result: listArr });
		}
	}
}
