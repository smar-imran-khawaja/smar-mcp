import { SmartsheetWorkspaceAPI } from '../smartsheet-workspace-api';
import { SmartsheetAPI } from '../smartsheet-api';

jest.mock('../smartsheet-api');

describe('SmartsheetWorkspaceAPI', () => {
  let api: SmartsheetAPI;
  let workspaceApi: SmartsheetWorkspaceAPI;

  beforeEach(() => {
    api = new SmartsheetAPI('dummy-token');
    workspaceApi = new SmartsheetWorkspaceAPI(api);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkspaces', () => {
    it('should call request with correct parameters', async () => {
      await workspaceApi.getWorkspaces();
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        '/workspaces'
      );
    });

    it('should return workspaces data', async () => {
      const mockResponse = [
        { id: 1, name: 'Workspace 1' },
        { id: 2, name: 'Workspace 2' }
      ];

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await workspaceApi.getWorkspaces();
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getWorkspace', () => {
    it('should call request with correct parameters', async () => {
      const workspaceId = '123';
      
      await workspaceApi.getWorkspace(workspaceId);
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        `/workspaces/${workspaceId}`
      );
    });

    it('should return workspace data', async () => {
      const workspaceId = '123';
      const mockResponse = {
        id: 123,
        name: 'Test Workspace',
        accessLevel: 'ADMIN'
      };

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await workspaceApi.getWorkspace(workspaceId);
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createWorkspace', () => {
    it('should call request with correct parameters', async () => {
      const workspaceName = 'New Workspace';
      const expectedData = { name: workspaceName };
      
      await workspaceApi.createWorkspace(workspaceName);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        '/workspaces',
        expectedData
      );
    });

    it('should return created workspace data', async () => {
      const workspaceName = 'New Workspace';
      const mockResponse = {
        id: 456,
        name: workspaceName,
        accessLevel: 'OWNER'
      };

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await workspaceApi.createWorkspace(workspaceName);
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listWorkspaceFolders', () => {
    it('should call request with correct parameters', async () => {
      const workspaceId = '123';
      
      await workspaceApi.listWorkspaceFolders(workspaceId);
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        `/workspaces/${workspaceId}/folders`
      );
    });

    it('should return workspace folders data', async () => {
      const workspaceId = '123';
      const mockResponse = [
        { id: 1, name: 'Folder 1' },
        { id: 2, name: 'Folder 2' }
      ];

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await workspaceApi.listWorkspaceFolders(workspaceId);
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createWorkspaceFolder', () => {
    it('should call request with correct parameters', async () => {
      const workspaceId = '123';
      const folderName = 'New Folder';
      const expectedData = { name: folderName };
      
      await workspaceApi.createWorkspaceFolder(workspaceId, folderName);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        `/workspaces/${workspaceId}/folders`,
        expectedData
      );
    });

    it('should return created folder data', async () => {
      const workspaceId = '123';
      const folderName = 'New Folder';
      const mockResponse = {
        id: 789,
        name: folderName,
        permalink: 'https://smartsheet.com/folders/789'
      };

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await workspaceApi.createWorkspaceFolder(workspaceId, folderName);
      
      expect(result).toEqual(mockResponse);
    });
  });
});
