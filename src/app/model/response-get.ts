export interface ResponseGet {
    spreadsheetId: string,
    range: string,
    majorDimension: string,
    values: Array<Array<string>>
}