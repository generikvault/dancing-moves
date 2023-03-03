import { dtoType } from "../util/util";

export interface DtoBase {
    location: string,
    row: number,
    dtoType: dtoType
}