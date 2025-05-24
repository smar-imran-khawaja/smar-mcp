import { SmartsheetFolderAPI } from '../smartsheet-folder-api';
import { SmartsheetAPI } from '../smartsheet-api';

jest.mock('../smartsheet-api');

describe('SmartsheetFolderAPI', () => {
  let api: SmartsheetAPI;
  let folderApi: SmartsheetFolderAPI;

  beforeEach(() => {
    api = new SmartsheetAPI('dummy-token');
    folderApi = new SmartsheetFolderAPI(api);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should call request with correct parameters', async () => {
      const folderId = '123';
      const folderName = 'New Folder';
      const expectedData = { name: folderName };
      
      await folderApi.createFolder(folderId, folderName);
      
      expect(api.request).toHaveBeenCalledWith(
        'POST',
        `/folders/${folderId}/folders`,
        expectedData
      );
    });

    it('should return the created folder data', async () => {
      const folderId = '123';
      const folderName = 'New Folder';
      const mockResponse = {
        id: 456,
        name: folderName,
        permalink: 'https://smartsheet.com/folders/456'
      };

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await folderApi.createFolder(folderId, folderName);
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getFolder', () => {
    it('should call request with correct parameters', async () => {
      const folderId = '123';
      
      await folderApi.getFolder(folderId);
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        `/folders/${folderId}`
      );
    });

    it('should return the folder data', async () => {
      const folderId = '123';
      const mockResponse = {
        id: 123,
        name: 'Test Folder',
        permalink: 'https://smartsheet.com/folders/123'
      };

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await folderApi.getFolder(folderId);
      
      expect(result).toEqual(mockResponse);
    });
  });
});
