import { SmartsheetUserAPI } from '../smartsheet-user-api';
import { SmartsheetAPI } from '../smartsheet-api';

jest.mock('../smartsheet-api');

describe('SmartsheetUserAPI', () => {
  let api: SmartsheetAPI;
  let userApi: SmartsheetUserAPI;

  beforeEach(() => {
    api = new SmartsheetAPI('dummy-token');
    userApi = new SmartsheetUserAPI(api);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should call request with correct parameters', async () => {
      const userId = '123';
      
      await userApi.getUserById(userId);
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        `/users/${userId}`
      );
    });

    it('should return the user data', async () => {
      const userId = '123';
      const mockResponse = {
        id: 123,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await userApi.getUserById(userId);
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentUser', () => {
    it('should call request with correct parameters', async () => {
      await userApi.getCurrentUser();
      
      expect(api.request).toHaveBeenCalledWith(
        'GET',
        '/users/me'
      );
    });

    it('should return the current user data', async () => {
      const mockResponse = {
        id: 456,
        email: 'current@example.com',
        firstName: 'Current',
        lastName: 'User'
      };

      jest.spyOn(api, 'request').mockResolvedValueOnce(mockResponse);
      
      const result = await userApi.getCurrentUser();
      
      expect(result).toEqual(mockResponse);
    });
  });
});
