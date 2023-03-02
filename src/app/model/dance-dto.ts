import { DtoBase } from "./dto-base";

export interface DanceDto extends DtoBase {
    name: string,
    type: string,
    music: string,
    rhythm: string,
    description: string,
    links: string,
    location: string,
    row: number
}