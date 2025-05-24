import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { SmartsheetAPI } from "../apis/smartsheet-api";

type RequestHandlerExtra = {
  signal: AbortSignal;
};

// Mock the MCP server
jest.mock("@modelcontextprotocol/sdk/server/mcp", () => {
  const mockTool = jest.fn();
  return {
    McpServer: jest.fn().mockImplementation(() => ({
      tool: mockTool,
      connect: jest.fn(),
      name: 'smartsheet',
      version: '1.0.0'
    }))
  };
});

// Mock the StdioServerTransport
jest.mock("@modelcontextprotocol/sdk/server/stdio", () => ({
  StdioServerTransport: jest.fn()
}));

// Mock the SmartsheetAPI
jest.mock("../apis/smartsheet-api", () => {
  const mockApi = {
    sheets: {
      getSheet: jest.fn(),
      getSheetVersion: jest.fn(),
      getCellHistory: jest.fn(),
      updateRows: jest.fn(),
      addRows: jest.fn(),
      deleteRows: jest.fn(),
      getSheetLocation: jest.fn(),
      copySheet: jest.fn(),
      createSheet: jest.fn(),
      getSheetDiscussions: jest.fn(),
      createRowDiscussion: jest.fn(),
      createUpdateRequest: jest.fn()
    },
    workspaces: {
      getWorkspaces: jest.fn(),
      getWorkspace: jest.fn(),
      createWorkspace: jest.fn(),
      createWorkspaceFolder: jest.fn()
    },
    folders: {
      getFolder: jest.fn(),
      createFolder: jest.fn()
    },
    users: {
      getCurrentUser: jest.fn(),
      getUserById: jest.fn()
    }
  };
  return {
    SmartsheetAPI: jest.fn(() => mockApi)
  };
});

describe('Smartsheet MCP Server', () => {
  let server: jest.Mocked<McpServer>;
  let api: jest.Mocked<SmartsheetAPI>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Import the index file to trigger tool registrations
    jest.isolateModules(() => {
      require('../index');
    });
    
    // Get the mocked instances
    server = new McpServer({} as any) as jest.Mocked<McpServer>;
    api = new SmartsheetAPI('dummy-token') as jest.Mocked<SmartsheetAPI>;
  });

  const mockExtra: RequestHandlerExtra = {
    signal: new AbortController().signal
  };

  describe('Tool Registration', () => {
    it('should register all tools with correct names and schemas', () => {
      const registeredTools = (server.tool as jest.Mock).mock.calls.map(call => ({
        name: call[0],
        description: call[1]
      }));

      // Verify core tools are registered
      expect(registeredTools).toContainEqual({
        name: 'get_sheet',
        description: 'Retrieves the current state of a sheet, including rows, columns, and cells'
      });

      expect(registeredTools).toContainEqual({
        name: 'get_sheet_version',
        description: 'Gets the current version number of a sheet'
      });

      expect(registeredTools).toContainEqual({
        name: 'get_cell_history',
        description: 'Retrieves the history of changes for a specific cell'
      });

      // ... and so on for other tools
    });

    it('should only register delete_rows when ALLOW_DELETE_TOOLS is true', () => {
      const originalEnv = process.env.ALLOW_DELETE_TOOLS;
      
      // Test with delete tools disabled
      process.env.ALLOW_DELETE_TOOLS = 'false';
      jest.isolateModules(() => {
        require('../index');
      });
      const disabledCalls = server.tool.mock.calls;
      const hasDeleteRowsDisabled = (server.tool as jest.Mock).mock.calls.some(call => call[0] === 'delete_rows');
      expect(hasDeleteRowsDisabled).toBe(false);

      // Test with delete tools enabled
      process.env.ALLOW_DELETE_TOOLS = 'true';
      jest.isolateModules(() => {
        require('../index');
      });
      const enabledCalls = server.tool.mock.calls;
      const hasDeleteRowsEnabled = (server.tool as jest.Mock).mock.calls.some(call => call[0] === 'delete_rows');
      expect(hasDeleteRowsEnabled).toBe(true);

      // Restore original env
      process.env.ALLOW_DELETE_TOOLS = originalEnv;
    });
  });

  describe('Tool Handlers', () => {
    describe('get_sheet', () => {
      it('should handle successful sheet retrieval', async () => {
        const mockSheet = { id: '123', name: 'Test Sheet' };
        (api.sheets.getSheet as jest.Mock).mockResolvedValueOnce(mockSheet);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_sheet')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ sheetId: '123', include: 'format,formulas' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockSheet, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.getSheet as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_sheet')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ sheetId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get sheet: API Error'
          }],
          isError: true
        });
      });
    });

    describe('create_workspace', () => {
      it('should handle successful workspace creation', async () => {
        const mockWorkspace = { id: '456', name: 'New Workspace' };
        (api.workspaces.createWorkspace as jest.Mock).mockResolvedValueOnce(mockWorkspace);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_workspace')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ workspaceName: 'New Workspace' });
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockWorkspace, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.workspaces.createWorkspace as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_workspace')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ workspaceName: 'New Workspace' });
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to create_workspace: API Error'
          }],
          isError: true
        });
      });
    });

    describe('add_rows', () => {
      it('should handle successful row addition', async () => {
        const mockResponse = [
          { id: 123, rowNumber: 1 },
          { id: 124, rowNumber: 2 }
        ];
        (api.sheets.addRows as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'add_rows')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rows: [
            {
              toTop: true,
              cells: [{ columnId: 456, value: 'Test Value' }]
            },
            {
              toBottom: true,
              cells: [{ columnId: 456, value: 'Test Value 2' }]
            }
          ]
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.addRows as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'add_rows')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rows: [{
            cells: [{ columnId: 456, value: 'Test Value' }]
          }]
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to add rows: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_sheet_version', () => {
      it('should handle successful version retrieval', async () => {
        const mockResponse = { version: 123 };
        (api.sheets.getSheetVersion as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_sheet_version')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ sheetId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.getSheetVersion as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_sheet_version')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ sheetId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get sheet version: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_cell_history', () => {
      it('should handle successful history retrieval', async () => {
        const mockResponse = [
          { modifiedAt: '2025-01-01', value: 'Old Value' },
          { modifiedAt: '2025-01-02', value: 'New Value' }
        ];
        (api.sheets.getCellHistory as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_cell_history')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rowId: '456',
          columnId: '789',
          pageSize: 100,
          page: 1
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.getCellHistory as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_cell_history')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rowId: '456',
          columnId: '789'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get cell history: API Error'
          }],
          isError: true
        });
      });
    });

    describe('update_rows', () => {
      it('should handle successful row update', async () => {
        const mockResponse = [
          { id: 1, rowNumber: 1, cells: [{ columnId: 456, value: 'Updated Value' }] }
        ];
        (api.sheets.updateRows as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'update_rows')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rows: [{
            id: 1,
            cells: [{ columnId: 456, value: 'Updated Value' }]
          }]
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.updateRows as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'update_rows')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rows: [{
            id: 1,
            cells: [{ columnId: 456, value: 'Updated Value' }]
          }]
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to update rows: API Error'
          }],
          isError: true
        });
      });
    });

    describe('create_update_request', () => {
      it('should handle successful update request creation', async () => {
        const mockResponse = { id: '789', sent: true };
        (api.sheets.createUpdateRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_update_request')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rowIds: [1, 2],
          sendTo: [{ email: 'test@example.com' }]
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });
    });
  });

    describe('delete_rows', () => {
      it('should handle successful row deletion', async () => {
        const mockResponse = { message: 'Success' };
        (api.sheets.deleteRows as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'delete_rows')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rowIds: ['1', '2', '3']
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.deleteRows as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'delete_rows')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rowIds: ['1', '2', '3']
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to delete rows: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_sheet_location', () => {
      it('should handle successful location retrieval', async () => {
        const mockResponse = { folderId: '456', folderType: 'workspace' };
        (api.sheets.getSheetLocation as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_sheet_location')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ sheetId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.getSheetLocation as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_sheet_location')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ sheetId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get sheet location: API Error'
          }],
          isError: true
        });
      });
    });

    describe('copy_sheet', () => {
      it('should handle successful sheet copy', async () => {
        const mockResponse = { id: '789', name: 'Sheet Copy' };
        (api.sheets.copySheet as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'copy_sheet')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          destinationName: 'Sheet Copy',
          destinationFolderId: '456'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.copySheet as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'copy_sheet')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          destinationName: 'Sheet Copy'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to copy sheet: API Error'
          }],
          isError: true
        });
      });
    });

    describe('create_sheet', () => {
      it('should handle successful sheet creation', async () => {
        const mockResponse = { id: '789', name: 'New Sheet' };
        (api.sheets.createSheet as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_sheet')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          name: 'New Sheet',
          columns: [
            { title: 'Column 1', type: 'TEXT_NUMBER' },
            { title: 'Column 2', type: 'DATE', primary: true }
          ]
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.createSheet as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_sheet')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          name: 'New Sheet',
          columns: [{ title: 'Column 1', type: 'TEXT_NUMBER' }]
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to create sheet: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_sheet_discussions', () => {
      it('should handle successful discussions retrieval', async () => {
        const mockResponse = [
          { id: 1, title: 'Discussion 1', comments: [] },
          { id: 2, title: 'Discussion 2', comments: [] }
        ];
        (api.sheets.getSheetDiscussions as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_sheet_discussions')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          include: 'comments',
          pageSize: 100,
          page: 1
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.getSheetDiscussions as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_sheet_discussions')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get sheet discussions: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_current_user', () => {
      it('should handle successful user retrieval', async () => {
        const mockResponse = {
          id: '123',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User'
        };
        (api.users.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_current_user')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({}, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.users.getCurrentUser as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_current_user')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({}, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get current user: API Error'
          }],
          isError: true
        });
      });
    });

    describe('create_row_discussion', () => {
      it('should handle successful discussion creation', async () => {
        const mockResponse = { id: 1, title: 'New Discussion' };
        (api.sheets.createRowDiscussion as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_row_discussion')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rowId: '456',
          commentText: 'Test comment'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.sheets.createRowDiscussion as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_row_discussion')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          sheetId: '123',
          rowId: '456',
          commentText: 'Test comment'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to create row discussion: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_workspaces', () => {
      it('should handle successful workspaces retrieval', async () => {
        const mockResponse = [
          { id: 1, name: 'Workspace 1' },
          { id: 2, name: 'Workspace 2' }
        ];
        (api.workspaces.getWorkspaces as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_workspaces')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({}, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.workspaces.getWorkspaces as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_workspaces')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({}, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get get_workspace: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_folder', () => {
      it('should handle successful folder retrieval', async () => {
        const mockResponse = { id: '123', name: 'Test Folder' };
        (api.folders.getFolder as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_folder')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ folderId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.folders.getFolder as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_folder')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ folderId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get_folder: API Error'
          }],
          isError: true
        });
      });
    });

    describe('create_workspace_folder', () => {
      it('should handle successful folder creation', async () => {
        const mockResponse = { id: '456', name: 'New Folder' };
        (api.workspaces.createWorkspaceFolder as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_workspace_folder')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          workspaceId: '123',
          folderName: 'New Folder'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.workspaces.createWorkspaceFolder as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_workspace_folder')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          workspaceId: '123',
          folderName: 'New Folder'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to create_workspace_folder: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_user', () => {
      it('should handle successful user retrieval', async () => {
        const mockResponse = {
          id: '123',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User'
        };
        (api.users.getUserById as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_user')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ userId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.users.getUserById as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_user')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ userId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get user: API Error'
          }],
          isError: true
        });
      });
    });

    describe('get_workspace', () => {
      it('should handle successful workspace retrieval', async () => {
        const mockResponse = { id: '123', name: 'Test Workspace' };
        (api.workspaces.getWorkspace as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_workspace')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ workspaceId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.workspaces.getWorkspace as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'get_workspace')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({ workspaceId: '123' }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to get get_workspace: API Error'
          }],
          isError: true
        });
      });
    });

    describe('create_folder', () => {
      it('should handle successful folder creation', async () => {
        const mockResponse = { id: '456', name: 'New Folder' };
        (api.folders.createFolder as jest.Mock).mockResolvedValueOnce(mockResponse);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_folder')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          folderId: '123',
          folderName: 'New Folder'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2)
          }]
        });
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        (api.folders.createFolder as jest.Mock).mockRejectedValueOnce(error);

        const handler = server.tool.mock.calls.find(call => call[0] === 'create_folder')?.[3];
        if (!handler) throw new Error('Handler not found');

        const result = await handler({
          folderId: '123',
          folderName: 'New Folder'
        }, mockExtra);
        
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: 'Failed to create_folder: API Error'
          }],
          isError: true
        });
      });
    });

  describe('Server Initialization', () => {
    it('should initialize with correct configuration', () => {
      const serverConfig = (McpServer as jest.Mock).mock.calls[0][0];
      
      expect(serverConfig).toEqual({
        name: 'smartsheet',
        version: '1.0.0'
      });
    });

    it('should initialize API client with environment variables', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        SMARTSHEET_API_KEY: 'test-key',
        SMARTSHEET_ENDPOINT: 'https://api.test.com'
      };

      jest.isolateModules(() => {
        require('../index');
      });

      expect(SmartsheetAPI).toHaveBeenCalledWith('test-key', 'https://api.test.com');

      process.env = originalEnv;
    });

    it('should handle server startup errors', async () => {
      const mockError = new Error('Connection failed');
      const mockConnect = jest.fn().mockRejectedValue(mockError);
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      const mockServer = {
        connect: mockConnect
      };

      jest.isolateModules(() => {
        const { main } = require('../index');
        main.call({ server: mockServer });
      });

      await new Promise(process.nextTick);

      expect(mockConsoleError).toHaveBeenCalledWith('Fatal error in main():', mockError);
      expect(mockExit).toHaveBeenCalledWith(1);

      mockConsoleError.mockRestore();
      mockExit.mockRestore();
    });
  });

  describe('Environment Configuration', () => {
    it('should enable delete tools when ALLOW_DELETE_TOOLS is true', () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, ALLOW_DELETE_TOOLS: 'true' };

      jest.isolateModules(() => {
        require('../index');
      });

      const hasDeleteRows = (server.tool as jest.Mock).mock.calls.some(
        call => call[0] === 'delete_rows'
      );
      expect(hasDeleteRows).toBe(true);

      process.env = originalEnv;
    });

    it('should disable delete tools when ALLOW_DELETE_TOOLS is false', () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, ALLOW_DELETE_TOOLS: 'false' };

      jest.isolateModules(() => {
        require('../index');
      });

      const hasDeleteRows = (server.tool as jest.Mock).mock.calls.some(
        call => call[0] === 'delete_rows'
      );
      expect(hasDeleteRows).toBe(false);

      process.env = originalEnv;
    });
  });
});
