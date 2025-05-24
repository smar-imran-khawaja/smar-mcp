import { SmartsheetAPI } from './smartsheet-api.js';

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
  async getSheet(sheetId: string, include?: string): Promise<any> {
    return this.api.request('GET', `/sheets/${sheetId}`, undefined, { include });
  }
  
  /**
   * Gets the version of a sheet
   * @param sheetId Sheet ID
   * @returns Sheet version
   */
  async getSheetVersion(sheetId: string): Promise<any> {
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
  ): Promise<any> {
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
  async updateRows(sheetId: string, rows: any[]): Promise<any> {
    return this.api.request('PUT', `/sheets/${sheetId}/rows`, rows);
  }
  
  /**
   * Adds rows to a sheet
   * @param sheetId Sheet ID
   * @param rows Array of row objects to add
   * @returns Add result
   */
  async addRows(sheetId: string, rows: any[]): Promise<any> {
    return this.api.request('POST', `/sheets/${sheetId}/rows`, rows);
  }
  
  /**
   * Deletes rows from a sheet
   * @param sheetId Sheet ID
   * @param rowIds Array of row IDs to delete
   * @param ignoreRowsNotFound Whether to ignore rows that don't exist
   * @returns Delete result
   */
  async deleteRows(sheetId: string, rowIds: string[], ignoreRowsNotFound: boolean = true): Promise<any> {
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
  async getSheetLocation(sheetId: string): Promise<any> {
    const sheet = await this.getSheet(sheetId);
    return {
      folderId: sheet.parentId,
      folderType: sheet.parentType,
      workspaceId: sheet.workspaceId
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
  ): Promise<any> {
    const data: any = {
      newName: destinationName
    };
    
    if (destinationFolderId) {
      data.destinationType = 'folder';
      data.destinationId = destinationFolderId;
      console.error(`[API] Copying sheet to folder: ${destinationFolderId}`);
    } else if (workspaceId) {
      data.destinationType = 'workspace';
      data.destinationId = workspaceId;
      console.error(`[API] Copying sheet to workspace: ${workspaceId}`);
    } else {
      // Default to 'home' if no folder or workspace specified
      data.destinationType = 'home';
      console.error(`[API] Copying sheet to home`);
    }
    
    const result = await this.api.request('POST', `/sheets/${sheetId}/copy`, data);
    console.error(`[API] Copy sheet result: ${JSON.stringify((result as any).result?.id)}`);
    return result;
  }
  
  /**
   * Creates a new sheet
   * @param name Name for the new sheet
   * @param columns Array of column objects
   * @param folderId Optional folder ID where the sheet should be created
   * @returns New sheet data
   */
  async createSheet(name: string, columns: any[], folderId?: string): Promise<any> {
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
  ): Promise<any> {
    return this.api.request('GET', `/sheets/${sheetId}/discussions`, undefined, {
      include,
      pageSize,
      page,
      includeAll,
    });
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
  ): Promise<any> {
    const data = {
      comment: {
        text: commentText
      }
    };
    
    return this.api.request('POST', `/sheets/${sheetId}/rows/${rowId}/discussions`, data);
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
  ): Promise<any> {
    return this.api.request('POST', `/sheets/${sheetId}/updaterequests`, options);
  }
}
