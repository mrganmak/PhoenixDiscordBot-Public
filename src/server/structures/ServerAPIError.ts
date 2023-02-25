import { ErrorsCodes, errorsMessages } from "../constants/errors";

export default class ServerAPIError {
	public code: ErrorsCodes;
	public message: string;

	constructor(code: ErrorsCodes, message?: string) {
		this.code = code;
		this.message = message ?? errorsMessages[code];
	}
}