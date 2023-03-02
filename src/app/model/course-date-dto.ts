import { DtoBase } from "./dto-base";

export interface CourseDateDto extends DtoBase {
    moveId: string,
    course: string,
    date: Date | null,
    description: string,
    location: string,
    row: number
}