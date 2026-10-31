class APIResponse<T = any> {
    public code: number;
    public data: T | null;
    public type: string;
    public description: string;

    static readonly NETWORK_ERROR = -1;
    static readonly NO_INTERNET = -2;
    static readonly SERVER_DOWN = -3;

    static readonly SUCCESS = 200;
    static readonly CREATED = 201;
    static readonly PARTIAL_CONTENT = 206;

    static readonly BAD_REQUEST = 400;
    static readonly UNAUTHORIZED = 401;
    static readonly FORBIDDEN = 403;
    static readonly NOT_FOUND = 404;
    static readonly REQUEST_TIMEOUT = 408;
    static readonly CONFLICT = 409;
    static readonly INTERNAL_SERVER_ERROR = 500;

    /** True if HTTP status code is 2xx */
    get isSuccess(): boolean {
        return typeof this.code === "number" && this.code >= 200 && this.code < 300;
    }

    /** True if HTTP status code is non-2xx */
    get isError(): boolean {
        return !this.isSuccess;
    }

    /** Returns backend message or default error description */
    get errorMessage(): string {
        return this.description || "Request failed.";
    }

    /** Returns backend success message or default description */
    get successMessage(): string {
        return this.description || "Request successful";
    }

    /** Static helper: safely checks if any response object succeeded */
    static isSuccess(res: any): boolean {
        if (!res) return false;
        if (typeof res.isSuccess === "boolean") return res.isSuccess;
        return typeof res.code === "number" && res.code >= 200 && res.code < 300;
    }

    /** Static helper: safely checks if any response object failed */
    static isError(res: any): boolean {
        return !APIResponse.isSuccess(res);
    }

    /** Static helper: safely extracts message from response or error object */
    static getMessage(res: any, fallback = "Request failed."): string {
        return (
            res?.description ||
            res?.message ||
            res?.data?.message ||
            res?.data?.description ||
            fallback
        );
    }

    constructor(code: number, data: T | null, customDescription?: string) {
        this.code = code;
        this.data = data;
        this.type = this.getTypeFromCode(code);
        this.description = customDescription || this.getDescriptionFromCode(code);

        if (!customDescription) {
            switch (code) {
                case APIResponse.SUCCESS:
                case APIResponse.CREATED:
                    this.setSuccessResponse();
                    break;
                case APIResponse.BAD_REQUEST:
                    this.setBadRequest();
                    break;
                case APIResponse.NOT_FOUND:
                    this.setNotFoundResponse();
                    break;
                case APIResponse.CONFLICT:
                    this.setConflictResponse();
                    break;
                case APIResponse.INTERNAL_SERVER_ERROR:
                    this.setInternalServerErrorResponse();
                    break;
                case APIResponse.NO_INTERNET:
                    this.setNoInternetError();
                    break;
                case APIResponse.SERVER_DOWN:
                    this.setServerDownError();
                    break;
                case APIResponse.NETWORK_ERROR:
                    this.setNetworkError();
                    break;
                case APIResponse.UNAUTHORIZED:
                    this.setUnauthorizedError();
                    break;
                case APIResponse.FORBIDDEN:
                    this.setForbiddenError();
                    break;
                default:
                    this.setUnknownErrorResponse();
                    break;
            }
        }
    }

    private setBadRequest(): void {
        this.type = "Bad Request";
        this.description = "Request was unsuccessful";
    }

    private setNotFoundResponse(): void {
        this.type = "Not Found";
        this.description = "The endpoint you're requesting is not available";
    }

    private setSuccessResponse(): void {
        this.type = "Success";
        this.description = "Request was successful";
    }

    private setConflictResponse(): void {
        this.type = "Conflict";
        this.description = "The request could not be completed due to a conflict";
    }

    private setInternalServerErrorResponse(): void {
        this.type = "Internal Server Error";
        this.description = "The server encountered an unexpected condition";
        this.data = null;
    }

    /**
     * @deprecated
     * Sets the response for a network error.
     */
    private setNetworkError(): void {
        this.type = "Network Error";
        this.code = -1;
        this.description = "Network error or request was blocked. Please check your internet connection.";
    }

    private setNoInternetError(): void {
        this.type = "No Internet";
        this.code = -2;
        this.description = "No internet connection. Please check your internet connection.";
    }

    private setServerDownError(): void {
        this.type = "Server Down";
        this.code = -3;
        this.description = "Server is down. Please try again later.";
    }

    private setUnknownErrorResponse(): void {
        this.type = "Unknown";
        this.description = "Unknown error occurred";
    }

    private setUnauthorizedError(): void {
        this.type = "Unauthorized";
        this.code = 401;
        this.description = "Unauthorized";
    }

    private setForbiddenError(): void {
        this.type = "Forbidden";
        this.code = 403;
        this.description = "Forbidden";
    }

    private getTypeFromCode(code: number): string {
        switch (code) {
            case APIResponse.SUCCESS:
                return "Success";
            case APIResponse.CREATED:
                return "Created";
            case APIResponse.BAD_REQUEST:
                return "Bad Request";
            case APIResponse.NOT_FOUND:
                return "Not Found";
            case APIResponse.REQUEST_TIMEOUT:
                return "Request Timeout";
            case APIResponse.CONFLICT:
                return "Conflict";
            case APIResponse.INTERNAL_SERVER_ERROR:
                return "Internal Server Error";
            case APIResponse.NO_INTERNET:
                return "No Internet";
            case APIResponse.SERVER_DOWN:
                return "Server Down";
            case APIResponse.NETWORK_ERROR:
                return "Network Error";
            case APIResponse.UNAUTHORIZED:
                return "Unauthorized";
            case APIResponse.FORBIDDEN:
                return "Forbidden";
            default:
                return "Unknown";
        }
    }

    private getDescriptionFromCode(code: number): string {
        switch (code) {
            case APIResponse.SUCCESS:
                return "Request successful";
            case APIResponse.BAD_REQUEST:
                return "Request was unsuccessful";
            case APIResponse.NOT_FOUND:
                return "Resource not found";
            case APIResponse.INTERNAL_SERVER_ERROR:
                return "Internal server error";
            case APIResponse.REQUEST_TIMEOUT:
                return "Request timeout";
            case APIResponse.CONFLICT:
                return "Conflict";
            case APIResponse.NO_INTERNET:
                return "No internet connection. Please check your internet connection.";
            case APIResponse.SERVER_DOWN:
                return "Server is down. Please try again later.";
            case APIResponse.NETWORK_ERROR:
                return "Network error";
            case APIResponse.UNAUTHORIZED:
                return "Unauthorized";
            case APIResponse.FORBIDDEN:
                return "Forbidden";
            default:
                return "An unknown error occurred";
        }
    }
}

export default APIResponse;
