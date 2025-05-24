/**
 * Represents the location information for a sheet, including its parent folder and workspace
 * @export
 * @interface SheetLocation
 */
export interface SheetLocation {
    /**
     * ID of the parent folder
     * @type {number}
     * @memberof SheetLocation
     */
    folderId?: number;

    /**
     * Type of the parent folder
     * @type {string}
     * @memberof SheetLocation
     */
    folderType?: string;

    /**
     * ID of the workspace containing the sheet
     * @type {number}
     * @memberof SheetLocation
     */
    workspaceId?: number;
}
