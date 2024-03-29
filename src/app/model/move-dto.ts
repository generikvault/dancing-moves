import { CourseDateDto } from "./course-date-dto";
import { DtoBase } from "./dto-base";
import { VideoDto } from "./video-dto";

export interface MoveDto extends DtoBase {
    name: string,
    dance: string,
    order: number,
    count: string,
    nameVerified: boolean,
    type: string,
    startMove: string[],
    endMove: string[],
    containedMoves: string[],
    relatedMoves: string[],
    relatedMovesOtherDances: string[],
    videoname: string[],
    media: string,
    description: string,
    descriptionEng: string,
    toDo: string,
    id: string,
    links: string,
    row: number,
    location: string,
    courseDates: CourseDateDto[]
    videos: VideoDto[]
}