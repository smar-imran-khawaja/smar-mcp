#!/usr/bin/env node

// Control whether deletion operations are enabled
const allowDeleteTools = process.env.ALLOW_DELETE_TOOLS === 'true';
console.info(`[Config] Delete operations are ${allowDeleteTools ? 'enabled' : 'disabled'}`);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SmartsheetAPI } from "./apis/smartsheet-api.js";

// Initialize the MCP server
const server = new McpServer({
  name: "smartsheet",
  version: "1.0.0",
});

// Initialize the direct API client
const api = new SmartsheetAPI(process.env.SMARTSHEET_API_KEY, process.env.SMARTSHEET_ENDPOINT);

// Tool: Get Sheet
server.tool(
  "get_sheet",
  "Retrieves the current state of a sheet, including rows, columns, and cells",
  {
    sheetId: z.string().describe("The ID of the sheet to retrieve"),
    include: z.string().optional().describe("Comma-separated list of elements to include (e.g., 'format,formulas')"),
  },
  async ({ sheetId, include }) => {
    try {
      console.info(`[Tool] Getting sheet with ID: ${sheetId}`);
      const sheet = await api.sheets.getSheet(sheetId, include);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(sheet, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in get_sheet:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get sheet: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Get Sheet Version
server.tool(
  "get_sheet_version",
  "Gets the current version number of a sheet",
  {
    sheetId: z.string().describe("The ID of the sheet"),
  },
  async ({ sheetId }) => {
    try {
      console.info(`[Tool] Getting version for sheet with ID: ${sheetId}`);
      const version = await api.sheets.getSheetVersion(sheetId);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(version, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in get_sheet_version:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get sheet version: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Get Cell History
server.tool(
  "get_cell_history",
  "Retrieves the history of changes for a specific cell",
  {
    sheetId: z.string().describe("The ID of the sheet"),
    rowId: z.string().describe("The ID of the row"),
    columnId: z.string().describe("The ID of the column"),
    include: z.string().optional().describe("Optional parameter to include additional information"),
    pageSize: z.number().optional().describe("Number of history entries to return per page"),
    page: z.number().optional().describe("Page number to return"),
  },
  async ({ sheetId, rowId, columnId, include, pageSize, page }) => {
    try {
      console.info(`[Tool] Getting history for cell at row ${rowId}, column ${columnId} in sheet ${sheetId}`);
      const history = await api.sheets.getCellHistory(sheetId, rowId, columnId, include, pageSize, page);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(history, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in get_cell_history:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get cell history: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Update Rows
server.tool(
  "update_rows",
  "Updates rows in a sheet, including cell values, formatting, and formulae",
  {
    sheetId: z.string().describe("The ID of the sheet"),
    rows: z.array(
      z.object({
        id: z.number().describe("Row ID"),
        cells: z.array(
          z.object({
            columnId: z.number().describe("Column ID"),
            value: z.any().optional().describe("Cell value"),
            formula: z.string().optional().describe("Cell formula"),
            format: z.string().optional().describe("Cell format"),
          })
        ).describe("Array of cell objects"),
      })
    ).describe("Array of row objects to update"),
  },
  async ({ sheetId, rows }) => {
    try {
      console.info(`[Tool] Updating ${rows.length} rows in sheet ${sheetId}`);
      const result = await api.sheets.updateRows(sheetId, rows);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in update_rows:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to update rows: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Add Rows
server.tool(
  "add_rows",
  "Adds new rows to a sheet",
  {
    sheetId: z.string().describe("The ID of the sheet"),
    rows: z.array(
      z.object({
        toTop: z.boolean().optional().describe("Add row to the top of the sheet"),
        toBottom: z.boolean().optional().describe("Add row to the bottom of the sheet"),
        cells: z.array(
          z.object({
            columnId: z.number().describe("Column ID"),
            value: z.any().optional().describe("Cell value"),
            formula: z.string().optional().describe("Cell formula"),
            format: z.string().optional().describe("Cell format"),
          })
        ).describe("Array of cell objects"),
      })
    ).describe("Array of row objects to add"),
  },
  async ({ sheetId, rows }) => {
    try {
      console.info(`[Tool] Adding ${rows.length} rows to sheet ${sheetId}`);
      const result = await api.sheets.addRows(sheetId, rows);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in add_rows:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to add rows: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Delete Rows (conditionally registered)
if (allowDeleteTools) {
  server.tool(
    "delete_rows",
    "Deletes rows from a sheet",
    {
      sheetId: z.string().describe("The ID of the sheet"),
      rowIds: z.array(z.string()).describe("Array of row IDs to delete"),
      ignoreRowsNotFound: z.boolean().optional().describe("If true, don't throw an error if rows are not found"),
    },
    async ({ sheetId, rowIds, ignoreRowsNotFound }) => {
      try {
        console.info(`[Tool] Deleting ${rowIds.length} rows from sheet ${sheetId}`);
        const result = await api.sheets.deleteRows(sheetId, rowIds, ignoreRowsNotFound);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in delete_rows:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete rows: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );
} else {
  console.info("[Config] Delete operations are disabled. Set ALLOW_DELETE_TOOLS=true to enable them.");
}

// Tool: Get Sheet Location
server.tool(
  "get_sheet_location",
  "Gets the folder ID where a sheet is located",
  {
    sheetId: z.string().describe("The ID of the sheet"),
  },
  async ({ sheetId }) => {
    try {
      console.info(`[Tool] Getting location for sheet ${sheetId}`);
      const location = await api.sheets.getSheetLocation(sheetId);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(location, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in get_sheet_location:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get sheet location: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Copy Sheet
server.tool(
  "copy_sheet",
  "Creates a copy of the specified sheet in the same folder",
  {
    sheetId: z.string().describe("The ID of the sheet to copy"),
    destinationName: z.string().describe("Name for the sheet copy"),
    destinationFolderId: z.string().optional().describe("ID of the destination folder (same as source if not specified)"),
  },
  async ({ sheetId, destinationName, destinationFolderId }) => {
    try {
      console.info(`[Tool] Copying sheet ${sheetId} to "${destinationName}"`);
      
      // If no destination folder is specified, get the current folder
      if (!destinationFolderId) {
        try {
          const location = await api.sheets.getSheetLocation(sheetId);
          destinationFolderId = location.folderId?.toString();
        } catch (error) {
          console.warn("[Warning] Failed to get sheet location, using default folder:", error);
        }
      }
      
      const result = await api.sheets.copySheet(sheetId, destinationName, destinationFolderId);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in copy_sheet:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to copy sheet: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Create Sheet
server.tool(
  "create_sheet",
  "Creates a new sheet",
  {
    name: z.string().describe("Name for the new sheet"),
    columns: z.array(
      z.object({
        title: z.string().describe("Column title"),
        type: z.string().describe("Column type"),
        primary: z.boolean().optional().describe("Whether this is the primary column"),
      })
    ).describe("Array of column objects"),
    folderId: z.string().optional().describe("ID of the folder where the sheet should be created"),
  },
  async ({ name, columns, folderId }) => {
    try {
      console.info(`[Tool] Creating new sheet "${name}"`);
      const result = await api.sheets.createSheet(name, columns, folderId);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in create_sheet:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to create sheet: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Get Sheet Discussions
server.tool(
  "get_sheet_discussions",
  "Retrieves the discussions for a sheet",
  {
    sheetId: z.string().describe("The ID of the sheet"),
    include: z.string().optional().describe("Optional parameter to include additional information (e.g., 'attachments')"),
    pageSize: z.number().optional().describe("Number of discussions to return per page"),
    page: z.number().optional().describe("Page number to return"),
    includeAll: z.boolean().optional().describe("Whether to include all results"),
  },
  async ({ sheetId, include, pageSize, page, includeAll }) => {
    try {
      console.info(`[Tool] Getting discussions for sheet ${sheetId}`);
      const discussions = await api.sheets.getSheetDiscussions(sheetId, include, pageSize, page, includeAll);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(discussions, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in get_sheet_discussions:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get sheet discussions: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Create Row Discussion
server.tool(
  "create_row_discussion",
  "Creates a discussion on a specific row",
  {
    sheetId: z.string().describe("The ID of the sheet"),
    rowId: z.string().describe("The ID of the row"),
    commentText: z.string().describe("Text of the comment to add"),
  },
  async ({ sheetId, rowId, commentText }) => {
    try {
      console.info(`[Tool] Creating discussion on row ${rowId} in sheet ${sheetId}`);
      const result = await api.sheets.createRowDiscussion(sheetId, rowId, commentText);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in create_row_discussion:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to create row discussion: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Create Update Request
server.tool(
  "create_update_request",
  "Creates an update request for a sheet",
  {
    sheetId: z.string().describe("The ID of the sheet"),
    rowIds: z.array(z.number()).optional().describe("Array of row IDs to include in the update request"),
    columnIds: z.array(z.number()).optional().describe("Array of column IDs to include in the update request"),
    includeAttachments: z.boolean().optional().describe("Whether to include attachments in the update request"),
    includeDiscussions: z.boolean().optional().describe("Whether to include discussions in the update request"),
    message: z.string().optional().describe("Message to include in the update request email"),
    subject: z.string().optional().describe("Subject line for the update request email"),
    ccMe: z.boolean().optional().describe("Whether to CC the sender on the update request email"),
    sendTo: z.array(
      z.object({
        email: z.string().describe("Email address of the recipient")
      })
    ).describe("Array of recipients for the update request"),
  },
  async ({ sheetId, rowIds, columnIds, includeAttachments, includeDiscussions, message, subject, ccMe, sendTo }) => {
    try {
      console.info(`[Tool] Creating update request for sheet ${sheetId}`);
      const result = await api.sheets.createUpdateRequest(sheetId, {
        rowIds,
        columnIds,
        includeAttachments,
        includeDiscussions,
        message,
        subject,
        ccMe,
        sendTo
      });
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error("[Error] in create_update_request:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to create update request: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Get Workspaces
server.tool(
    "get_workspaces",
    "Retrieves my Workspaces",
    {},
    async ({ }) => {
      try {
        console.info(`[Tool] Getting workspaces`);
        const workspace = await api.workspaces.getWorkspaces();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(workspace, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in get_workspace:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get get_workspace: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
);

// Tool: Get Workspace
server.tool(
    "get_workspace",
    "Retrieves the current state of a Workspace, including its contents which can be sheets, reports, or other folders",
    {
      workspaceId: z.string().describe("The ID of the workspace to retrieve")
    },
    async ({ workspaceId}) => {
      try {
        console.info(`[Tool] Getting workspace with ID: ${workspaceId}`);
        const workspace = await api.workspaces.getWorkspace(workspaceId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(workspace, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in get_workspace:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get get_workspace: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
);

// Tool: Create workspace
server.tool(
    "create_workspace",
    "Creates a new workspace",
    {
      workspaceName: z.string().describe("The name of the new workspace")
    },
    async ({ workspaceName }) => {
      try {
        console.info(`[Tool] Creating workspace: ${workspaceName}`);
        const workspace = await api.workspaces.createWorkspace(workspaceName);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(workspace, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in create_workspace:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to create_workspace: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
);

// Tool: Get Folder
server.tool(
    "get_folder",
    "Retrieves the current state of a folder, including its contents which can be sheets, reports, or other folders",
    {
      folderId: z.string().describe("The ID of the folder to retrieve")
    },
    async ({ folderId}) => {
      try {
        console.info(`[Tool] Getting folder with ID: ${folderId}`);
        const folder = await api.folders.getFolder(folderId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(folder, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in get_folder:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get_folder: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
);

// Tool: Create Folder in folder
server.tool(
    "create_folder",
    "Creates a new folder in a folder",
    {
      folderId: z.string().describe("The ID of the folder to create the folder in"),
      folderName: z.string().describe("The name of the new folder")
    },
    async ({ folderId, folderName }) => {
      try {
        console.info(`[Tool] Creating folder in workspace with ID: ${folderId}`);
        const folder = await api.folders.createFolder(folderId, folderName);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(folder, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in create_folder:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to create_folder: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
);

// Tool: Create Folder in workspace
server.tool(
    "create_workspace_folder",
    "Creates a new folder in a workspace",
    {
      workspaceId: z.string().describe("The ID of the workspace to create the folder in"),
      folderName: z.string().describe("The name of the new folder")
    },
    async ({ workspaceId, folderName }) => {
      try {
        console.info(`[Tool] Creating folder in workspace with ID: ${workspaceId}`);
        const folder = await api.workspaces.createWorkspaceFolder(workspaceId, folderName);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(folder, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in create_workspace_folder:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to create_workspace_folder: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
);

// Tool: Get Current User
server.tool(
    "get_current_user",
    "Gets the current user's information",
    async () => {
      try {
        console.info("[Tool] Getting current user");
        const user = await api.users.getCurrentUser();
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(user, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in get_current_user:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get current user: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
);

// Tool: Get User
server.tool(
    "get_user",
    "Gets a user's information by ID",
    {
      userId: z.string().describe("ID of the user to get")
    },
    async ({ userId }) => {
      try {
        console.info(`[Tool] Getting user with ID: ${userId}`);
        const user = await api.users.getUserById(userId);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(user, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error("[Error] in get_user:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get user: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.info("Smartsheet MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});