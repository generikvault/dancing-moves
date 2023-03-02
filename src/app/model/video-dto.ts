import { SafeResourceUrl } from "@angular/platform-browser";
import { DtoBase } from "./dto-base";

export interface VideoDto extends DtoBase {
    name: string,
    link: string,
    linkEncripted: string,
    courseName: string,
    safeUrl?: SafeResourceUrl,
    changed: boolean,
    location: string,
    row: number
}