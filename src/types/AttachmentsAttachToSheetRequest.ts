/* tslint:disable */
/* eslint-disable */
/**
 * Smartsheet OpenAPI Reference
 * Represents a request to attach a file to a sheet
 */

export interface AttachmentsAttachToSheetRequest {
    /**
     * Name of the file being attached
     */
    name?: string;
    /**
     * File data as a byte array
     */
    file?: Blob;
}

export function AttachmentsAttachToSheetRequestFromJSON(json: any): AttachmentsAttachToSheetRequest {
    return {
        'name': json['name'],
        'file': json['file']
    };
}

export function AttachmentsAttachToSheetRequestToJSON(value?: AttachmentsAttachToSheetRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        'name': value.name,
        'file': value.file
    };
}
