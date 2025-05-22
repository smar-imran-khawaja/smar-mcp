import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Hono } from "hono";
import { createSmartsheetDirectAPI } from "./smartsheet-direct-api.js";
import { createVersionBackup } from "./smartsheet-workflows.js";

// Define Env as an empty interface since it's used in Bindings
interface Env {}

type Bindings = Env;

const app = new Hono<{
  Bindings: Bindings;
}>();

type Props = {
  authToken: string;
  baseUrl: string;
  allowDeleteTools: boolean;
};

type State = null;

export class SmarMCP extends McpAgent<Bindings, State, Props> {
  server = new McpServer({
    name: "Smartsheet MCP",
    version: "1.0.0",
  });

  constructor(env: any, props: Props) {
    // Set the base URL in the environment
    if (process) {
      process.env.SMARTSHEET_ENDPOINT = props.baseUrl;
    }
    // Pass both env and props to the parent class
    super(env, props);
  }

  async init() {

    // Tool 1: Get Sheet
    this.server.tool(
        "get_sheet",
        "Retrieves the current state of a Smartsheet sheet, including rows, columns, and cells",
        {
          sheetId: z.string().describe("The ID of the sheet to retrieve"),
          include: z
              .string()
              .optional()
              .describe(
                  "Comma-separated list of elements to include (e.g., 'format,formulas')",
              ),
        },
        async ({ sheetId, include }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.info(`[Tool] Getting sheet with ID: ${sheetId}`);
            const sheet = await api.getSheet(sheetId, include);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(sheet, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in get_sheet:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to get sheet: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    ),

        // Tool 2: Get Sheet Version
        this.server.tool(
            "get_sheet_version",
            "Gets the current version number of a sheet",
            {
              sheetId: z.string().describe("The ID of the sheet"),
            },
            async ({ sheetId }) => {
              try {
                const api = createSmartsheetDirectAPI(
                    this.props.authToken,
                    this.props.baseUrl,
                );

                console.error(`[Tool] Getting version for sheet with ID: ${sheetId}`);
                const version = await api.getSheetVersion(sheetId);

                return {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify(version, null, 2),
                    },
                  ],
                };
              } catch (error: any) {
                console.error("[Error] in get_sheet_version:", error);
                return {
                  content: [
                    {
                      type: "text",
                      text: `Failed to get sheet version: ${error.message}`,
                    },
                  ],
                  isError: true,
                };
              }
            },
        );

    // Tool 3: Get Cell History
    this.server.tool(
        "get_cell_history",
        "Retrieves the history of changes for a specific cell",
        {
          sheetId: z.string().describe("The ID of the sheet"),
          rowId: z.string().describe("The ID of the row"),
          columnId: z.string().describe("The ID of the column"),
          include: z
              .string()
              .optional()
              .describe("Optional parameter to include additional information"),
          pageSize: z
              .number()
              .optional()
              .describe("Number of history entries to return per page"),
          page: z.number().optional().describe("Page number to return"),
        },
        async ({ sheetId, rowId, columnId, include, pageSize, page }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(
                `[Tool] Getting history for cell at row ${rowId}, column ${columnId} in sheet ${sheetId}`,
            );
            const history = await api.getCellHistory(
                sheetId,
                rowId,
                columnId,
                include,
                pageSize,
                page,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(history, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in get_cell_history:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to get cell history: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 4: Update Rows
    this.server.tool(
        "update_rows",
        "Updates rows in a sheet, including cell values, formatting, and formulae",
        {
          sheetId: z.string().describe("The ID of the sheet"),
          rows: z
              .array(
                  z.object({
                    id: z.string().describe("Row ID"),
                    cells: z
                        .array(
                            z.object({
                              columnId: z.number().or(z.string()).describe("Column ID"),
                              value: z.any().optional().describe("Cell value"),
                              formula: z.string().optional().describe("Cell formula"),
                              format: z.string().optional().describe("Cell format"),
                            }),
                        )
                        .describe("Array of cell objects"),
                  }),
              )
              .describe("Array of row objects to update"),
        },
        async ({ sheetId, rows }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(
                `[Tool] Updating ${rows.length} rows in sheet ${sheetId}`,
            );
            const result = await api.updateRows(sheetId, rows);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in update_rows:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to update rows: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 5: Add Rows
    this.server.tool(
        "add_rows",
        "Adds new rows to a sheet",
        {
          sheetId: z.string().describe("The ID of the sheet"),
          rows: z
              .array(
                  z.object({
                    toTop: z
                        .boolean()
                        .optional()
                        .describe("Add row to the top of the sheet"),
                    toBottom: z
                        .boolean()
                        .optional()
                        .describe("Add row to the bottom of the sheet"),
                    cells: z
                        .array(
                            z.object({
                              columnId: z.number().or(z.string()).describe("Column ID"),
                              value: z.any().optional().describe("Cell value"),
                              formula: z.string().optional().describe("Cell formula"),
                              format: z.string().optional().describe("Cell format"),
                            }),
                        )
                        .describe("Array of cell objects"),
                  }),
              )
              .describe("Array of row objects to add"),
        },
        async ({ sheetId, rows }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(
                `[Tool] Adding ${rows.length} rows to sheet ${sheetId}`,
            );
            const result = await api.addRows(sheetId, rows);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in add_rows:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to add rows: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 6: Delete Rows (conditionally registered)
    if (this.props.allowDeleteTools) {
      this.server.tool(
          "delete_rows",
          "Deletes rows from a sheet",
          {
            sheetId: z.string().describe("The ID of the sheet"),
            rowIds: z.array(z.string()).describe("Array of row IDs to delete"),
            ignoreRowsNotFound: z
                .boolean()
                .optional()
                .describe("If true, don't throw an error if rows are not found"),
          },
          async ({ sheetId, rowIds, ignoreRowsNotFound }) => {
            try {
              const api = createSmartsheetDirectAPI(
                  this.props.authToken,
                  this.props.baseUrl,
              );

              console.error(
                  `[Tool] Deleting ${rowIds.length} rows from sheet ${sheetId}`,
              );
              const result = await api.deleteRows(
                  sheetId,
                  rowIds,
                  ignoreRowsNotFound,
              );

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                  },
                ],
              };
            } catch (error: any) {
              console.error("[Error] in delete_rows:", error);
              return {
                content: [
                  {
                    type: "text",
                    text: `Failed to delete rows: ${error.message}`,
                  },
                ],
                isError: true,
              };
            }
          },
      );
    } else {
      console.info(
          "[Config] Delete operations are disabled. Set ALLOW_DELETE_TOOLS=true to enable them.",
      );
    }

    // Tool 7: Get Sheet Location
    this.server.tool(
        "get_sheet_location",
        "Gets the folder ID where a sheet is located",
        {
          sheetId: z.string().describe("The ID of the sheet"),
        },
        async ({ sheetId }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(`[Tool] Getting location for sheet ${sheetId}`);
            const location = await api.getSheetLocation(sheetId);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(location, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in get_sheet_location:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to get sheet location: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 8: Copy Sheet
    this.server.tool(
        "copy_sheet",
        "Creates a copy of the specified sheet in the same folder",
        {
          sheetId: z.string().describe("The ID of the sheet to copy"),
          destinationName: z.string().describe("Name for the sheet copy"),
          destinationFolderId: z
              .string()
              .optional()
              .describe(
                  "ID of the destination folder (same as source if not specified)",
              ),
        },
        async ({ sheetId, destinationName, destinationFolderId }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(
                `[Tool] Copying sheet ${sheetId} to "${destinationName}"`,
            );

            // If no destination folder is specified, get the current folder
            if (!destinationFolderId) {
              try {
                const location = await api.getSheetLocation(sheetId);
                destinationFolderId = location.folderId;
              } catch (error) {
                console.error(
                    "[Warning] Failed to get sheet location, using default folder:",
                    error,
                );
              }
            }

            const result = await api.copySheet(
                sheetId,
                destinationName,
                destinationFolderId,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in copy_sheet:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to copy sheet: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 9: Create Sheet
    this.server.tool(
        "create_sheet",
        "Creates a new sheet",
        {
          name: z.string().describe("Name for the new sheet"),
          columns: z
              .array(
                  z.object({
                    title: z.string().describe("Column title"),
                    type: z.string().describe("Column type"),
                    primary: z
                        .boolean()
                        .optional()
                        .describe("Whether this is the primary column"),
                  }),
              )
              .describe("Array of column objects"),
          folderId: z
              .string()
              .optional()
              .describe("ID of the folder where the sheet should be created"),
        },
        async ({ name, columns, folderId }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(`[Tool] Creating new sheet "${name}"`);
            const result = await api.createSheet(name, columns, folderId);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in create_sheet:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to create sheet: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 10: Create Version Backup (Workflow)
    this.server.tool(
        "create_version_backup",
        "Creates a backup sheet with data from a specific timestamp",
        {
          sheetId: z.string().describe("The ID of the source sheet"),
          timestamp: z
              .string()
              .describe(
                  "The ISO 8601 timestamp to use for historical data (e.g., '2025-03-27T13:00:00Z')",
              ),
          archiveName: z
              .string()
              .optional()
              .describe(
                  "Name for the archive sheet (defaults to 'Original Sheet Name - Archive YYYY-MM-DD')",
              ),
          createBackup: z
              .boolean()
              .default(false)
              .describe(
                  "Not used for archive sheet, but required by the interface",
              ),
          includeFormulas: z
              .boolean()
              .default(true)
              .describe("Whether to include formulas in the archive"),
          includeFormatting: z
              .boolean()
              .default(true)
              .describe("Whether to include formatting in the archive"),
          batchSize: z
              .number()
              .default(100)
              .describe("Number of rows to process in each batch"),
          maxConcurrentRequests: z
              .number()
              .default(5)
              .describe("Maximum number of concurrent API requests"),
        },
        async (options) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(
                `[Tool] Creating version backup for ${options.sheetId} at timestamp ${options.timestamp}`,
            );
            const result = await createVersionBackup(api, options);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in create_version_backup:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to create version backup: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 11: Get Sheet Discussions
    this.server.tool(
        "get_sheet_discussions",
        "Retrieves the discussions for a sheet",
        {
          sheetId: z.string().describe("The ID of the sheet"),
          include: z
              .string()
              .optional()
              .describe(
                  "Optional parameter to include additional information (e.g., 'attachments')",
              ),
          pageSize: z
              .number()
              .optional()
              .describe("Number of discussions to return per page"),
          page: z.number().optional().describe("Page number to return"),
          includeAll: z
              .boolean()
              .optional()
              .describe("Whether to include all results"),
        },
        async ({ sheetId, include, pageSize, page, includeAll }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(`[Tool] Getting discussions for sheet ${sheetId}`);
            const discussions = await api.getSheetDiscussions(
                sheetId,
                include,
                pageSize,
                page,
                includeAll,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(discussions, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in get_sheet_discussions:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to get sheet discussions: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 12: Create Row Discussion
    this.server.tool(
        "create_row_discussion",
        "Creates a discussion on a specific row",
        {
          sheetId: z.string().describe("The ID of the sheet"),
          rowId: z.string().describe("The ID of the row"),
          commentText: z.string().describe("Text of the comment to add"),
        },
        async ({ sheetId, rowId, commentText }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(
                `[Tool] Creating discussion on row ${rowId} in sheet ${sheetId}`,
            );
            const result = await api.createRowDiscussion(
                sheetId,
                rowId,
                commentText,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in create_row_discussion:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to create row discussion: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool 13: Create Update Request
    this.server.tool(
        "create_update_request",
        "Creates an update request for a sheet",
        {
          sheetId: z.string().describe("The ID of the sheet"),
          rowIds: z
              .array(z.number())
              .optional()
              .describe("Array of row IDs to include in the update request"),
          columnIds: z
              .array(z.number())
              .optional()
              .describe("Array of column IDs to include in the update request"),
          includeAttachments: z
              .boolean()
              .optional()
              .describe("Whether to include attachments in the update request"),
          includeDiscussions: z
              .boolean()
              .optional()
              .describe("Whether to include discussions in the update request"),
          message: z
              .string()
              .optional()
              .describe("Message to include in the update request email"),
          subject: z
              .string()
              .optional()
              .describe("Subject line for the update request email"),
          ccMe: z
              .boolean()
              .optional()
              .describe("Whether to CC the sender on the update request email"),
          sendTo: z
              .array(
                  z.object({
                    email: z.string().describe("Email address of the recipient"),
                  }),
              )
              .describe("Array of recipients for the update request"),
        },
        async ({
                 sheetId,
                 rowIds,
                 columnIds,
                 includeAttachments,
                 includeDiscussions,
                 message,
                 subject,
                 ccMe,
                 sendTo,
               }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.error(`[Tool] Creating update request for sheet ${sheetId}`);
            const result = await api.createUpdateRequest(sheetId, {
              rowIds,
              columnIds,
              includeAttachments,
              includeDiscussions,
              message,
              subject,
              ccMe,
              sendTo,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in create_update_request:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to create update request: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool: Get Workspaces
    this.server.tool(
        "get_workspaces",
        "Retrieves my Workspaces",
        {},
        async ({}) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.info(`[Tool] Getting workspaces`);
            const workspace = await api.getWorkspaces();

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(workspace, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in get_workspace:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to get get_workspace: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool: Get Workspace
    this.server.tool(
        "get_workspace",
        "Retrieves the current state of a Workspace, including its contents which can be sheets, reports, or other folders",
        {
          workspaceId: z.string().describe("The ID of the workspace to retrieve"),
        },
        async ({ workspaceId }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.info(`[Tool] Getting workspace with ID: ${workspaceId}`);
            const workspace = await api.getWorkspace(workspaceId);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(workspace, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in get_workspace:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to get get_workspace: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool: Create workspace
    this.server.tool(
        "create_workspace",
        "Creates a new workspace",
        {
          workspaceName: z.string().describe("The name of the new workspace"),
        },
        async ({ workspaceName }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.info(`[Tool] Creating workspace: ${workspaceName}`);
            const workspace = await api.createWorkspace(workspaceName);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(workspace, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in create_workspace:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to create_workspace: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool: Get Folder
    this.server.tool(
        "get_folder",
        "Retrieves the current state of a folder, including its contents which can be sheets, reports, or other folders",
        {
          folderId: z.string().describe("The ID of the folder to retrieve"),
        },
        async ({ folderId }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.info(`[Tool] Getting folder with ID: ${folderId}`);
            const folder = await api.getFolder(folderId);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(folder, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in get_folder:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to get_folder: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool: Create Folder in folder
    this.server.tool(
        "create_folder",
        "Creates a new folder in a folder",
        {
          folderId: z
              .string()
              .describe("The ID of the folder to create the folder in"),
          folderName: z.string().describe("The name of the new folder"),
        },
        async ({ folderId, folderName }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.info(
                `[Tool] Creating folder in workspace with ID: ${folderId}`,
            );
            const folder = await api.createFolder(folderId, folderName);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(folder, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in create_folder:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to create_folder: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

    // Tool: Create Folder in workspace
    this.server.tool(
        "create_workspace_folder",
        "Creates a new folder in a workspace",
        {
          workspaceId: z
              .string()
              .describe("The ID of the workspace to create the folder in"),
          folderName: z.string().describe("The name of the new folder"),
        },
        async ({ workspaceId, folderName }) => {
          try {
            const api = createSmartsheetDirectAPI(
                this.props.authToken,
                this.props.baseUrl,
            );

            console.info(
                `[Tool] Creating folder in workspace with ID: ${workspaceId}`,
            );
            const folder = await api.createWorkspaceFolder(
                workspaceId,
                folderName,
            );

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(folder, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error("[Error] in create_workspace_folder:", error);
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to create_workspace_folder: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        },
    );

  }
}

app.mount("/", (req, env, ctx) => {
  // This could technically be pulled out into a middleware function, but is left here for clarity

  const authToken = req.headers.get("authToken");
  const baseUrl = req.headers.get("baseUrl");
  const allowDeleteTools = req.headers.get("allowDeleteTools");
  if (!authToken || !baseUrl) {
    return new Response("Unauthorized", { status: 401 });
  }
  ctx.props = {
    authToken: authToken,
    baseUrl: baseUrl,
    allowDeleteTools: allowDeleteTools === "false",
  };

  return SmarMCP.mount("/sse").fetch(req, env, ctx);
});

export default app;
