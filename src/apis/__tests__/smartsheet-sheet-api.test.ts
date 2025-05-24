import { SmartsheetSheetAPI } from '../smartsheet-sheet-api';
import { SmartsheetAPI } from '../smartsheet-api';

jest.mock('../smartsheet-api');

describe('SmartsheetSheetAPI', () => {
  let api: SmartsheetAPI;
  let sheetApi: SmartsheetSheetAPI;

  beforeEach(() => {
    api = new SmartsheetAPI('dummy-token');
    sheetApi = new SmartsheetSheetAPI(api);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSheet', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      const include = 'discussions,attachments';
      
      await sheetApi.getSheet(sheetId, include);
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        `/sheets/${sheetId}`,
        undefined,
        { include }
      );
    });
  });

  describe('getSheetVersion', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      
      await sheetApi.getSheetVersion(sheetId);
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        `/sheets/${sheetId}/version`
      );
    });
  });

  describe('getCellHistory', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      const rowId = '456';
      const columnId = '789';
      const include = 'all';
      const pageSize = 100;
      const page = 1;
      
      await sheetApi.getCellHistory(sheetId, rowId, columnId, include, pageSize, page);
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        `/sheets/${sheetId}/rows/${rowId}/columns/${columnId}/history`,
        undefined,
        { include, pageSize, page }
      );
    });
  });

  describe('updateRows', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      const rows = [{ id: 1, cells: [] }];
      
      await sheetApi.updateRows(sheetId, rows);
      
      expect(api.request).toHaveBeenCalledWith(
        'PUT',
        `/sheets/${sheetId}/rows`,
        rows
      );
    });
  });

  describe('addRows', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      const rows = [{ cells: [] }];
      
      await sheetApi.addRows(sheetId, rows);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        `/sheets/${sheetId}/rows`,
        rows
      );
    });
  });

  describe('deleteRows', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      const rowIds = ['1', '2', '3'];
      
      await sheetApi.deleteRows(sheetId, rowIds);
      
      expect(api.request).toHaveBeenCalledWith(
        'DELETE',
        `/sheets/${sheetId}/rows`,
        undefined,
        {
          ids: rowIds.join(','),
          ignoreRowsNotFound: 'true'
        }
      );
    });
  });

  describe('getSheetLocation', () => {
    it('should return location info from sheet data', async () => {
      const sheetId = '123';
      const mockSheet = {
        workspace: { id: 'workspace-123' }
      };
      
      jest.spyOn(api, 'request').mockResolvedValueOnce(mockSheet);
      
      const result = await sheetApi.getSheetLocation(sheetId);
      
      expect(result).toEqual({
        folderId: 'workspace-123',
        folderType: 'workspace',
        workspaceId: 'workspace-123'
      });
    });
  });

  describe('copySheet', () => {
    it('should call request with folder destination', async () => {
      const sheetId = '123';
      const destinationName = 'New Sheet';
      const destinationFolderId = 'folder-123';
      
      await sheetApi.copySheet(sheetId, destinationName, destinationFolderId);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        `/sheets/${sheetId}/copy`,
        {
          newName: destinationName,
          destinationType: 'folder',
          destinationId: destinationFolderId
        }
      );
    });

    it('should call request with workspace destination', async () => {
      const sheetId = '123';
      const destinationName = 'New Sheet';
      const workspaceId = 'workspace-123';
      
      await sheetApi.copySheet(sheetId, destinationName, undefined, workspaceId);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        `/sheets/${sheetId}/copy`,
        {
          newName: destinationName,
          destinationType: 'workspace',
          destinationId: workspaceId
        }
      );
    });
  });

  describe('createSheet', () => {
    it('should call request with correct parameters in root', async () => {
      const name = 'New Sheet';
      const columns = [{ title: 'Column 1', type: 'TEXT_NUMBER' }];
      
      await sheetApi.createSheet(name, columns);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        '/sheets',
        { name, columns }
      );
    });

    it('should call request with correct parameters in folder', async () => {
      const name = 'New Sheet';
      const columns = [{ title: 'Column 1', type: 'TEXT_NUMBER' }];
      const folderId = 'folder-123';
      
      await sheetApi.createSheet(name, columns, folderId);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        `/folders/${folderId}/sheets`,
        { name, columns }
      );
    });
  });

  describe('getSheetDiscussions', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      const include = 'attachments';
      const pageSize = 100;
      const page = 1;
      const includeAll = true;
      
      const mockResponse = [{ id: 1, title: 'Discussion 1' }];
      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      await sheetApi.getSheetDiscussions(sheetId, include, pageSize, page, includeAll);
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        `/sheets/${sheetId}/discussions`,
        undefined,
        { include, pageSize, page, includeAll }
      );
    });
  });

  describe('createRowDiscussion', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      const rowId = '456';
      const commentText = 'Test comment';
      
      await sheetApi.createRowDiscussion(sheetId, rowId, commentText);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        `/sheets/${sheetId}/rows/${rowId}/discussions`,
        {
          comment: {
            text: commentText
          }
        }
      );
    });
  });

  describe('createUpdateRequest', () => {
    it('should call request with correct parameters', async () => {
      const sheetId = '123';
      const options = {
        rowIds: [1, 2, 3],
        columnIds: [4, 5, 6],
        includeAttachments: true,
        includeDiscussions: true,
        message: 'Please review',
        sendTo: [{ email: 'test@example.com' }],
        subject: 'Review Request',
        ccMe: true
      };
      
      await sheetApi.createUpdateRequest(sheetId, options);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        `/sheets/${sheetId}/updaterequests`,
        options
      );
    });
  });
});
