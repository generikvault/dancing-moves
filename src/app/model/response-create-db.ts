
export interface ResponseCreateDb {
    spreadsheetId: string,
    spreadsheetUrl: string,
    properties: {
        title: string,
        locale: string,
        autoRecalc: string,
        timeZone: string,
        defaultFormat: {
            backgroundColor: {
                red: number,
                green: number,
                blue: number
            }
        },
        spreadsheetTheme: any,
    },
    sheets: Array<{ properties: { title: string } }>
}