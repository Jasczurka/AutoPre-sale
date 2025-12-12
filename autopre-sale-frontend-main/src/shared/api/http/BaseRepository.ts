import type {IHttpService} from "./IHttpService";

abstract class BaseRepository {
    protected readonly _httpService: IHttpService

    constructor(httpService: IHttpService) {
        this._httpService = httpService
    }
}

export { BaseRepository };
