/* tslint:disable */
/* eslint-disable */
/**
 * Smartsheet OpenAPI Reference
 * Represents a request to create a comment with an attachment
 */

export interface CommentCreationRequestWithAttachment {
    /**
     * The comment text
     */
    text?: string;
    /**
     * Name of the file being attached
     */
    file?: {
        name: string;
        content: Blob;
    };
}

export function CommentCreationRequestWithAttachmentFromJSON(json: any): CommentCreationRequestWithAttachment {
    return {
        'text': json['text'],
        'file': json['file']
    };
}

export function CommentCreationRequestWithAttachmentToJSON(value?: CommentCreationRequestWithAttachment | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        'text': value.text,
        'file': value.file
    };
}
