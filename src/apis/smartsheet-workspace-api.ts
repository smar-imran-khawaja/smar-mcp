import { SmartsheetAPI } from './smartsheet-api.js';

/**
 * Workspace-specific API methods for Smartsheet
 */
export class SmartsheetWorkspaceAPI {
  private api: SmartsheetAPI;

  constructor(api: SmartsheetAPI) {
    this.api = api;
  }

  /**
   * Gets workspaces
   * @returns workspaces data
   */
  async getWorkspaces(): Promise<any[]> {
    return this.api.request('GET', `/workspaces`);
  }

  /**
   * Gets a workspace by ID
   * @param workspaceId workspace ID
   * @returns workspace data
   */
  async getWorkspace(workspaceId: string): Promise<any> {
    return this.api.request('GET', `/workspaces/${workspaceId}`);
  }

  /**
   * Creates a workspace
   * @param workspaceName Name of the workspace to create
   * @returns Created workspace data
   */
  async createWorkspace(workspaceName: string): Promise<any> {
    const data = {
      name: workspaceName
    };

    return this.api.request('POST', `/workspaces`, data);
  }

  /**
   * Lists folders in a workspace
   * @param workspaceId Workspace ID
   * @returns List of folders in the workspace
   */
  async listWorkspaceFolders(workspaceId: string): Promise<any> {
    return this.api.request('GET', `/workspaces/${workspaceId}/folders`);
  }

  /**
   * Creates a folder in a workspace
   * @param workspaceId Workspace ID
   * @param folderName Name of the folder to create
   * @returns Created folder data
   */
  async createWorkspaceFolder(workspaceId: string, folderName: string): Promise<any> {
    const data = {
      name: folderName
    };
    
    return this.api.request('POST', `/workspaces/${workspaceId}/folders`, data);
  }
}
