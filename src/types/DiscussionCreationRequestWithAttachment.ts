/* tslint:disable */
/* eslint-disable */
/**
 * Smartsheet OpenAPI Reference
 * Represents a request to create a discussion with an attachment
 */

export interface DiscussionCreationRequestWithAttachment {
    /**
     * Discussion object
     */
    discussion: {
        title?: string;
        comment: {
            text: string;
        };
    };
    /**
     * File attachment
     */
    file?: {
        name: string;
        content: Blob;
    };
}

export function DiscussionCreationRequestWithAttachmentFromJSON(json: any): DiscussionCreationRequestWithAttachment {
    return {
        'discussion': json['discussion'],
        'file': json['file']
    };
}

export function DiscussionCreationRequestWithAttachmentToJSON(value?: DiscussionCreationRequestWithAttachment | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        'discussion': value.discussion,
        'file': value.file
    };
}
