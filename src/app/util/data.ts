import { CourseDateDto } from "../model/course-date-dto";
import { MoveDto } from "../model/move-dto";
import { VideoDto } from "../model/video-dto";

export const easterEggMoves = {
    Konami: {
        dance: "Westcoast Swing",
        name: "Konami",
        count: "10",
        startMove: [] as string[],
        endMove: [] as string[],
        containedMoves: [] as string[],
        relatedMoves: [] as string[],
        relatedMovesOtherDances: [] as string[],
        courseDates: [] as CourseDateDto[],
        videos: [] as VideoDto[],
        description: "# Ablauf \n## Leader\n- 1 links vor\n- 2 rechts vor\n- 3 links zurück\n- 4 rechts zurück\n- 5 links Gewichtsverlagerung\n- 6 rechts Gewichtsverlagerung\n- 7 links Gewichtsverlagerung\n- 8 rechts Gewichtsverlagerung\n- 9 Bauch raus\n- 10 Anker\n\n## Follower\ngespiegelt\n# Bemerkung\nSchalted extra Power beim Follower frei"
    } as MoveDto
} as { [name: string]: MoveDto }