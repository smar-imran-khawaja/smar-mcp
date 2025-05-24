import { SmartsheetAPI } from './smartsheet-api.js';

/**
 * Folder-specific API methods for Smartsheet
 */
export class SmartsheetFolderAPI {
  private api: SmartsheetAPI;

  constructor(api: SmartsheetAPI) {
    this.api = api;
  }

  /**
   * Creates a new folder in a folder
   * @param folderId folder ID
   * @param folderName Name of the folder to create
   * @returns Created folder data
   */
  async createFolder(folderId: string, folderName: string): Promise<any> {
    const data = {
      name: folderName
    };

    return this.api.request('POST', `/folders/${folderId}/folders`, data);
  }

  /**
   * Gets a folder by ID
   * @param folderId Folder ID
   * @returns Folder data
   */
  async getFolder(folderId: string): Promise<any> {
    return this.api.request('GET', `/folders/${folderId}`);
  }
}
