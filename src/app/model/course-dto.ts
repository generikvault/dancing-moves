import { VideoDto } from "./video-dto"

export interface CourseDto {
    name: string,
    dances: string[],
    school: string,
    description: string,
    teacher: string,
    level: string,
    start: Date | null,
    end: Date | null,
    time: string,
    groupName: string,
    hash: string,
    salt: string,
    contents: VideoDto[],
    location: string,
    row: number
}