/* tslint:disable */
/* eslint-disable */
/**
 * Smartsheet OpenAPI Reference
 * Welcome to the OpenAPI reference documentation for the Smartsheet API!
 */

import type { GridListing } from './GridListing';
import {
    GridListingFromJSON,
    GridListingFromJSONTyped,
    GridListingToJSON,
} from './GridListing';
import type { DashboardListing } from './DashboardListing';
import {
    DashboardListingFromJSON,
    DashboardListingFromJSONTyped,
    DashboardListingToJSON,
} from './DashboardListing';

/**
 * Can contain dashboards, folders, reports, sheets, or templates.
 * @export
 * @interface Folder
 */
export interface Folder {
    /**
     * 
     * @type {number}
     * @memberof Folder
     */
    id?: number;
    /**
     * 
     * @type {boolean}
     * @memberof Folder
     */
    favorite?: boolean;
    /**
     * 
     * @type {Array<Folder>}
     * @memberof Folder
     */
    folders?: Array<Folder>;
    /**
     * 
     * @type {string}
     * @memberof Folder
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof Folder
     */
    permalink?: string;
    /**
     * 
     * @type {Array<GridListing>}
     * @memberof Folder
     */
    reports?: Array<GridListing>;
    /**
     * 
     * @type {Array<GridListing>}
     * @memberof Folder
     */
    sheets?: Array<GridListing>;
    /**
     * 
     * @type {Array<DashboardListing>}
     * @memberof Folder
     */
    sights?: Array<DashboardListing>;
    /**
     * 
     * @type {Array<GridListing>}
     * @memberof Folder
     */
    templates?: Array<GridListing>;
}

/**
 * Check if a given object implements the Folder interface.
 */
export function instanceOfFolder(value: object): value is Folder {
    let isValidFormat = true;
    isValidFormat = isValidFormat && "id" in value;
    return isValidFormat;
}

/**
 * Convert Folder to JSON
 */
export function FolderToJSON(value?: Folder | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        id: value.id,
        favorite: value.favorite,
        folders: value.folders?.map(FolderToJSON),
        name: value.name,
        permalink: value.permalink,
        reports: value.reports?.map(GridListingToJSON),
        sheets: value.sheets?.map(GridListingToJSON),
        sights: value.sights?.map(DashboardListingToJSON),
        templates: value.templates?.map(GridListingToJSON)
    };
}

/**
 * Convert Folder to JSON with type information
 */
export function FolderToJSONTyped(value?: Folder | null): any {
    return FolderToJSON(value);
}

/**
 * Convert JSON to Folder
 */
export function FolderFromJSON(json: any): Folder {
    if (json === undefined || json === null) {
        return json;
    }
    return {
        id: json['id'],
        favorite: json['favorite'],
        folders: json['folders']?.map(FolderFromJSON),
        name: json['name'],
        permalink: json['permalink'],
        reports: json['reports']?.map(GridListingFromJSON),
        sheets: json['sheets']?.map(GridListingFromJSON),
        sights: json['sights']?.map(DashboardListingFromJSON),
        templates: json['templates']?.map(GridListingFromJSON)
    };
}

/**
 * Convert JSON to Folder with type information
 */
export function FolderFromJSONTyped(json: any): Folder {
    return FolderFromJSON(json);
}
