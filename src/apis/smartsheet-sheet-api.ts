import { Sheet } from '../types/Sheet';
import { SheetVersion } from '../types/SheetVersion';
import { CellHistory } from '../types/CellHistory';
import { Row } from '../types/Row';
import { RowsAddToSheet200Response } from '../types/RowsAddToSheet200Response';
import { DeleteRows200Response } from '../types/DeleteRows200Response';
import { CopySheet200Response, CopySheet200ResponseFromJSON } from '../types/CopySheet200Response';
import { Discussion, DiscussionFromJSON } from '../types/Discussion';
import { SheetLocation } from '../types/SheetLocation';
import { UpdaterequestsCreate200Response, UpdaterequestsCreate200ResponseFromJSON } from '../types/UpdaterequestsCreate200Response';
import { SmartsheetAPI } from './smartsheet-api';

/**
 * Sheet-specific API methods for Smartsheet
 */
export class SmartsheetSheetAPI {
  private api: SmartsheetAPI;

  constructor(api: SmartsheetAPI) {
    this.api = api;
  }

  /**
   * Gets a sheet by ID
   * @param sheetId Sheet ID
   * @param include Optional comma-separated list of elements to include
   * @returns Sheet data
   */
  async getSheet(sheetId: string, include?: string): Promise<Sheet> {
    return this.api.request('GET', `/sheets/${sheetId}`, undefined, { include });
  }
  
  /**
   * Gets the version of a sheet
   * @param sheetId Sheet ID
   * @returns Sheet version
   */
  async getSheetVersion(sheetId: string): Promise< SheetVersion> {
    return this.api.request('GET', `/sheets/${sheetId}/version`);
  }
  
  /**
   * Gets the history of a specific cell
   * @param sheetId Sheet ID
   * @param rowId Row ID
   * @param columnId Column ID
   * @param include Optional parameter to include additional information
   * @param pageSize Number of history entries to return per page
   * @param page Page number to return
   * @returns Cell history
   */
  async getCellHistory(
    sheetId: string, 
    rowId: string, 
    columnId: string, 
    include?: string, 
    pageSize?: number, 
    page?: number
  ): Promise<CellHistory> {
    return this.api.request('GET', `/sheets/${sheetId}/rows/${rowId}/columns/${columnId}/history`, undefined, {
      include,
      pageSize,
      page
    });
  }
  
  /**
   * Updates rows in a sheet
   * @param sheetId Sheet ID
   * @param rows Array of row objects to update
   * @returns Update result
   */
  async updateRows(sheetId: string, rows: Row[]): Promise<Row[]> {
    return this.api.request('PUT', `/sheets/${sheetId}/rows`, rows);
  }
  
  /**
   * Adds rows to a sheet
   * @param sheetId Sheet ID
   * @param rows Array of row objects to add
   * @returns Add result
   */
  async addRows(sheetId: string, rows: Row[]): Promise<RowsAddToSheet200Response> {
    return this.api.request('POST', `/sheets/${sheetId}/rows`, rows);
  }
  
  /**
   * Deletes rows from a sheet
   * @param sheetId Sheet ID
   * @param rowIds Array of row IDs to delete
   * @param ignoreRowsNotFound Whether to ignore rows that don't exist
   * @returns Delete result
   */
  async deleteRows(sheetId: string, rowIds: string[], ignoreRowsNotFound: boolean = true): Promise<DeleteRows200Response> {
    return this.api.request('DELETE', `/sheets/${sheetId}/rows`, undefined, {
      ids: rowIds.join(','),
      ignoreRowsNotFound: ignoreRowsNotFound.toString()
    });
  }
  
  /**
   * Gets the location information for a sheet
   * @param sheetId Sheet ID
   * @returns Location information including folder ID
   */
  async getSheetLocation(sheetId: string): Promise<SheetLocation> {
    const sheet = await this.getSheet(sheetId);
    return {
      folderId: sheet.workspace?.id,
      folderType: 'workspace',
      workspaceId: sheet.workspace?.id
    };
  }
  
  /**
   * Creates a copy of a sheet
   * @param sheetId Sheet ID to copy
   * @param destinationName Name for the new sheet
   * @param destinationFolderId Optional folder ID for the new sheet
   * @param workspaceId Optional workspace ID for the new sheet
   * @returns New sheet data
   */
  async copySheet(
    sheetId: string,
    destinationName: string,
    destinationFolderId?: string,
    workspaceId?: string
  ): Promise<CopySheet200Response> {
    const data: any = {
      newName: destinationName
    };
    
    if (destinationFolderId) {
      data.destinationType = 'folder';
      data.destinationId = destinationFolderId;

    } else if (workspaceId) {
      data.destinationType = 'workspace';
      data.destinationId = workspaceId;

    } else {
      // Default to 'home' if no folder or workspace specified
      data.destinationType = 'home';

    }
    
    const response = await this.api.request('POST', `/sheets/${sheetId}/copy`, data);

    return CopySheet200ResponseFromJSON(response);
  }
  
  /**
   * Creates a new sheet
   * @param name Name for the new sheet
   * @param columns Array of column objects
   * @param folderId Optional folder ID where the sheet should be created
   * @returns New sheet data
   */
  async createSheet(name: string, columns: any[], folderId?: string): Promise<Sheet> {
    const data = {
      name,
      columns
    };
    
    let endpoint = '/sheets';
    
    // If folder ID is provided, create in that folder
    if (folderId) {
      endpoint = `/folders/${folderId}/sheets`;
    }
    
    return this.api.request('POST', endpoint, data);
  }
  
  /**
   * Gets discussions for a sheet
   * @param sheetId Sheet ID
   * @param include Optional parameter to include additional information (e.g., 'attachments')
   * @param pageSize Number of discussions to return per page
   * @param page Page number to return
   * @param includeAll Whether to include all results
   * @returns Sheet discussions
   */
  async getSheetDiscussions(
    sheetId: string,
    include?: string,
    pageSize?: number,
    page?: number,
    includeAll?: boolean
  ): Promise<Discussion[]> {
    const response = await this.api.request('GET', `/sheets/${sheetId}/discussions`, undefined, {
      include,
      pageSize,
      page,
      includeAll,
    });
    return (response as any[]).map(item => DiscussionFromJSON(item));
  }
  
  /**
   * Creates a discussion on a row
   * @param sheetId Sheet ID
   * @param rowId Row ID
   * @param commentText Text of the comment to add
   * @returns Created discussion data
   */
  async createRowDiscussion(
    sheetId: string,
    rowId: string,
    commentText: string
  ): Promise<Discussion> {
    const data = {
      comment: {
        text: commentText
      }
    };
    
    const response = await this.api.request('POST', `/sheets/${sheetId}/rows/${rowId}/discussions`, data);
    return DiscussionFromJSON(response);
  }
  
  /**
   * Creates an update request for a sheet
   * @param sheetId Sheet ID
   * @param options Update request options
   * @returns Created update request data
   */
  async createUpdateRequest(
    sheetId: string,
    options: {
      rowIds?: number[];
      columnIds?: number[];
      includeAttachments?: boolean;
      includeDiscussions?: boolean;
      message?: string;
      sendTo: { email: string }[];
      subject?: string;
      ccMe?: boolean;
    }
  ): Promise<UpdaterequestsCreate200Response> {
    const response = await this.api.request('POST', `/sheets/${sheetId}/updaterequests`, options);
    return UpdaterequestsCreate200ResponseFromJSON(response);
  }
}
