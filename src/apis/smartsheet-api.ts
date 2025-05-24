import axios from 'axios';
import { SmartsheetSheetAPI } from './smartsheet-sheet-api.js';
import { SmartsheetWorkspaceAPI } from './smartsheet-workspace-api.js';
import { SmartsheetFolderAPI } from './smartsheet-folder-api.js';
import { SmartsheetUserAPI } from './smartsheet-user-api.js';

/**
 * Direct Smartsheet API client that doesn't rely on the SDK
 */
export class SmartsheetAPI {
  private baseUrl: string;
  private accessToken: string;
  public sheets: SmartsheetSheetAPI;
  public workspaces: SmartsheetWorkspaceAPI;
  public folders: SmartsheetFolderAPI;
  public users: SmartsheetUserAPI;

  /**
   * Creates a new SmartsheetAPI instance
   * @param accessToken Smartsheet API access token
   * @param baseUrl Smartsheet API base URL
   */
  constructor(accessToken?: string, baseUrl?: string) {
    this.baseUrl = baseUrl || '';
    this.accessToken = accessToken || '';
    this.sheets = new SmartsheetSheetAPI(this);
    this.workspaces = new SmartsheetWorkspaceAPI(this);
    this.folders = new SmartsheetFolderAPI(this);
    this.users = new SmartsheetUserAPI(this);
    
    if (this.accessToken == '') {
      throw new Error('SMARTSHEET_API_KEY environment variable is not set');
    } 

    if (this.baseUrl == '') {
      throw new Error('SMARTSHEET_ENDPOINT environment variable is not set');
    }
  }

  /**
   * Makes a request to the Smartsheet API with retry logic
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param data Request body data
   * @param queryParams Query parameters
   * @returns API response
   */
  async request<T>(
    method: string, 
    endpoint: string, 
    data?: any, 
    queryParams?: Record<string, any>
  ): Promise<T> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        
        // Add query parameters if provided
        if (queryParams) {
          Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.append(key, String(value));
            }
          });
        }
        
        console.error(`[API] ${method} ${url.toString()}`);
        
        const response = await axios({
          method,
          url: url.toString(),
          data,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'mcp',
          }
        });
        
        return response.data;
      } catch (error: any) {
        // Check if rate limited
        if (error.response?.status === 429 && retries < maxRetries) {
          const retryAfter = error.response.headers['retry-after'] || 1;
          const delay = Math.max(
            parseInt(retryAfter, 10) * 1000,
            Math.pow(2, retries) * 1000 + Math.random() * 1000
          );
          console.error(`[Rate Limit] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else {
          console.error('[Error] API request failed:', error.response?.data || error.message);
          throw this.formatError(error);
        }
      }
    }
    
    throw new Error('Maximum retries exceeded');
  }
  
  /**
   * Formats an error for consistent error handling
   * @param error Error to format
   * @returns Formatted error
   */
  private formatError(error: any): Error {
    const errorMessage = error.response?.data?.message || error.message;
    const formattedError = new Error(errorMessage);
    
    // Add additional properties
    (formattedError as any).statusCode = error.response?.status;
    (formattedError as any).errorCode = error.response?.data?.errorCode;
    (formattedError as any).detail = error.response?.data?.detail;
    
    return formattedError;
  }
}
