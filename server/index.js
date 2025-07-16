#!/usr/bin/env node

/**
 * Things 3 MCP Server - Main Entry Point
 * 
 * This server provides MCP tools for creating, updating, and managing items in Things 3.
 * Key features:
 * - User-friendly date parameter mapping (due_date = when to work on, deadline = when actually due)
 * - Comprehensive CRUD operations for todos, projects, and areas
 * - Robust error handling and validation
 * - Centralized parameter mapping and AppleScript execution
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { ThingsValidator, AppleScriptSanitizer, ThingsLogger, DateConverter, ParameterBuilder, ParameterMapper, StatusValidator } from "./utils.js";
import { AppleScriptTemplates } from "./applescript-templates.js";
import { DataParser } from "./data-parser.js";

const execAsync = promisify(exec);

class ThingsExtension {
  constructor() {
    try {
      this.server = new Server(
        {
          name: "things-dxt",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      this.setupToolHandlers();
      this.setupErrorHandling();
    } catch (error) {
      console.error("Failed to initialize Things MCP server:", error);
      process.exit(1);
    }
  }

  /**
   * Execute AppleScript template with parameters and handle common patterns
   */
  async executeThingsScript(template, scriptParams, operationName) {
    const buildParams = ParameterBuilder.buildParameters(
      scriptParams, 
      scriptParams.tags, 
      scriptParams.due_date, 
      scriptParams.activation_date
    );
    const script = AppleScriptSanitizer.buildScript(template, buildParams);
    
    try {
      return await this.executeAppleScript(script);
    } catch (error) {
      ThingsLogger.error(`${operationName} failed`, { 
        name: scriptParams.name,
        error: error.message 
      });
      throw error;
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      ThingsLogger.error("MCP Server Error", { error: error.message, stack: error.stack });
    };

    process.on("SIGINT", async () => {
      ThingsLogger.info("Received SIGINT, shutting down gracefully");
      await this.server.close();
      process.exit(0);
    });

    process.on("uncaughtException", (error) => {
      ThingsLogger.error("Uncaught Exception", { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      ThingsLogger.error("Unhandled Rejection", { reason, promise });
      process.exit(1);
    });
  }

  async executeAppleScript(script, timeout = 30000) {
    try {
      ThingsLogger.debug("Executing AppleScript", { scriptLength: script.length });
      
      // Properly escape the script for shell execution
      const escapedScript = script.replace(/'/g, "'\"'\"'");
      const command = `osascript -e '${escapedScript}'`;
      
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        maxBuffer: 1024 * 1024, // 1MB max buffer
      });
      
      if (stderr) {
        ThingsLogger.warn("AppleScript stderr output", { stderr });
        throw new Error(`AppleScript error: ${stderr}`);
      }
      
      const result = stdout.trim();
      ThingsLogger.debug("AppleScript execution completed", { resultLength: result.length });
      return result;
    } catch (error) {
      ThingsLogger.error("AppleScript execution failed", { 
        error: error.message,
        timeout: error.code === 'ETIMEDOUT'
      });
      
      if (error.code === 'ETIMEDOUT') {
        throw new McpError(
          ErrorCode.InternalError,
          "AppleScript execution timed out"
        );
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to execute AppleScript: ${error.message}`
      );
    }
  }

  async validateThingsRunning() {
    try {
      const script = AppleScriptTemplates.isThingsRunning();
      const result = await this.executeAppleScript(script);
      if (result !== "true") {
        throw new McpError(
          ErrorCode.InternalError,
          "Things 3 is not running. Please launch Things 3 and try again."
        );
      }
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        "Failed to check if Things 3 is running"
      );
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "create_todo",
            description: "Create a new to-do item in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The title of the to-do item",
                },
                notes: {
                  type: "string",
                  description: "Optional notes for the to-do item",
                },
                due_date: {
                  type: "string",
                  description: "Optional due date (when scheduled to work on) in YYYY-MM-DD format",
                },
                deadline: {
                  type: "string",
                  description: "Optional deadline (when actually due) in YYYY-MM-DD format",
                },
                project: {
                  type: "string",
                  description: "Optional project name to add the to-do to",
                },
                area: {
                  type: "string",
                  description: "Optional area name to add the to-do to",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional array of tag names",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "create_project",
            description: "Create a new project in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the project",
                },
                notes: {
                  type: "string",
                  description: "Optional notes for the project",
                },
                area: {
                  type: "string",
                  description: "Optional area name to add the project to",
                },
                due_date: {
                  type: "string",
                  description: "Optional due date (when scheduled to work on) in YYYY-MM-DD format",
                },
                deadline: {
                  type: "string",
                  description: "Optional deadline (when actually due) in YYYY-MM-DD format",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional array of tag names",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "create_area",
            description: "Create a new area in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the area",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional array of tag names",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "get_areas",
            description: "Get areas from Things",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "complete_todo",
            description: "Mark a to-do as completed in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the to-do to complete",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "search_items",
            description: "Search for items in Things",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query",
                },
                type: {
                  type: "string",
                  enum: ["all", "todo", "project", "area"],
                  description: "Type of items to search for",
                  default: "all",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_upcoming_todos",
            description: "Get upcoming todos from Things within a specified number of days",
            inputSchema: {
              type: "object",
              properties: {
                days: {
                  type: "number",
                  description: "Number of days ahead to look for upcoming todos",
                  default: 7,
                },
                completed: {
                  type: "boolean",
                  description: "Whether to include completed todos",
                  default: false,
                },
                limit: {
                  type: "number",
                  description: "Maximum number of todos to return",
                  default: 50,
                },
              },
            },
          },
          {
            name: "update_todo",
            description: "Update an existing to-do item in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The current name of the to-do to update",
                },
                new_name: {
                  type: "string",
                  description: "Optional new name for the to-do",
                },
                notes: {
                  type: "string",
                  description: "Optional new notes for the to-do",
                },
                due_date: {
                  type: "string",
                  description: "Optional due date (when scheduled to work on) in YYYY-MM-DD format",
                },
                deadline: {
                  type: "string",
                  description: "Optional deadline (when actually due) in YYYY-MM-DD format",
                },
                project: {
                  type: "string",
                  description: "Optional project name to move the to-do to",
                },
                area: {
                  type: "string",
                  description: "Optional area name to move the to-do to",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional array of tag names to set",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "cancel_todo",
            description: "Cancel a to-do item in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the to-do to cancel",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "cancel_project",
            description: "Cancel a project in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the project to cancel",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "delete_todo",
            description: "Delete a to-do item in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the to-do to delete",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "delete_project",
            description: "Delete a project in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the project to delete",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "delete_area",
            description: "Delete an area in Things",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the area to delete",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "get_todos",
            description: "Get to-do items from Things with flexible filtering",
            inputSchema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["open", "completed", "canceled"],
                  description: "Status filter for todos",
                  default: "open",
                },
                list: {
                  type: "string",
                  enum: ["inbox", "today", "upcoming", "anytime", "someday", "all"],
                  description: "Which list to get to-dos from",
                  default: "all",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of to-dos to return",
                  default: 50,
                },
              },
            },
          },
          {
            name: "get_projects",
            description: "Get projects from Things with flexible filtering",
            inputSchema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["open", "completed", "canceled"],
                  description: "Status filter for projects",
                  default: "open",
                },
                area: {
                  type: "string",
                  description: "Optional area name to filter projects",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of projects to return",
                  default: 50,
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.validateThingsRunning();

        switch (name) {
          case "create_todo":
            return await this.createTodo(args);
          case "create_project":
            return await this.createProject(args);
          case "create_area":
            return await this.createArea(args);
          case "get_areas":
            return await this.getAreas(args);
          case "complete_todo":
            return await this.completeTodo(args);
          case "search_items":
            return await this.searchItems(args);
          case "get_upcoming_todos":
            return await this.getUpcomingTodos(args);
          case "update_todo":
            return await this.updateTodo(args);
          case "cancel_todo":
            return await this.cancelTodo(args);
          case "cancel_project":
            return await this.cancelProject(args);
          case "delete_todo":
            return await this.deleteTodo(args);
          case "delete_project":
            return await this.deleteProject(args);
          case "delete_area":
            return await this.deleteArea(args);
          case "get_todos":
            return await this.getTodosByStatus(args);
          case "get_projects":
            return await this.getProjectsByStatus(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async createTodo(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    ThingsLogger.info("Creating to-do", { name: scriptParams.name });

    const scriptTemplate = AppleScriptTemplates.createTodo(scriptParams);
    const result = await this.executeThingsScript(scriptTemplate, scriptParams, "Create todo");
    
    ThingsLogger.logAssignmentWarnings(scriptParams, "created");
    ThingsLogger.info("To-do created successfully", { name: scriptParams.name, id: result });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Created to-do: ${scriptParams.name}`,
      id: result,
    });
  }

  async createProject(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    ThingsLogger.info("Creating project", { name: scriptParams.name });

    const scriptTemplate = AppleScriptTemplates.createProject(scriptParams);
    const result = await this.executeThingsScript(scriptTemplate, scriptParams, "Create project");
    
    if (scriptParams.area) {
      ThingsLogger.info("Project created with area assignment", { 
        name: scriptParams.name, 
        area: scriptParams.area,
        note: "If area doesn't exist, project will remain without area assignment"
      });
    }
    
    ThingsLogger.info("Project created successfully", { name: scriptParams.name, id: result });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Created project: ${scriptParams.name}`,
      id: result,
    });
  }

  async createArea(args) {
    // Validate all inputs
    const validatedName = ThingsValidator.validateStringInput(args.name, "name");
    const validatedTags = args.tags ? ThingsValidator.validateArrayInput(args.tags, "tags") : null;

    ThingsLogger.info("Creating area", { name: validatedName });

    const scriptParams = {
      name: validatedName,
      tags: validatedTags
    };

    const scriptTemplate = AppleScriptTemplates.createArea(scriptParams);
    const buildParams = ParameterBuilder.buildParameters(scriptParams, validatedTags);
    const script = AppleScriptSanitizer.buildScript(scriptTemplate, buildParams);
    const result = await this.executeAppleScript(script);
    
    ThingsLogger.info("Area created successfully", { name: validatedName, id: result });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Created area: ${validatedName}`,
      id: result,
    });
  }


  async getAreas(args) {
    ThingsLogger.info("Getting areas");

    const script = AppleScriptTemplates.getAreas();
    const result = await this.executeAppleScript(script);
    const areas = DataParser.parseAreas(result);
    
    ThingsLogger.info("Retrieved areas successfully", { count: areas.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: areas.length,
      areas: areas,
    });
  }

  async completeTodo(args) {
    return await this.changeItemStatus(args, "to-do", "completed", "Completed");
  }

  async searchItems(args) {
    // Validate inputs
    const validatedQuery = ThingsValidator.validateStringInput(args.query, "query");
    const validTypes = ["all", "todo", "project", "area"];
    const searchType = args.type || "all";
    
    if (!validTypes.includes(searchType)) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid search type: ${searchType}. Must be one of: ${validTypes.join(', ')}`);
    }

    ThingsLogger.info("Searching items", { query: validatedQuery, type: searchType });

    let searchResults = [];
    
    // Search todos
    if (searchType === "all" || searchType === "todo") {
      const todoScript = AppleScriptTemplates.searchTodos(validatedQuery);
      const script = AppleScriptSanitizer.buildScript(todoScript, { query: validatedQuery });
      const result = await this.executeAppleScript(script);
      const todos = DataParser.parseSearchResults(result, 'todo');
      searchResults.push(...todos);
    }
    
    // Search projects
    if (searchType === "all" || searchType === "project") {
      const projectScript = AppleScriptTemplates.searchProjects(validatedQuery);
      const script = AppleScriptSanitizer.buildScript(projectScript, { query: validatedQuery });
      const result = await this.executeAppleScript(script);
      const projects = DataParser.parseSearchResults(result, 'project');
      searchResults.push(...projects);
    }
    
    // Search areas
    if (searchType === "all" || searchType === "area") {
      const areaScript = AppleScriptTemplates.searchAreas(validatedQuery);
      const script = AppleScriptSanitizer.buildScript(areaScript, { query: validatedQuery });
      const result = await this.executeAppleScript(script);
      const areas = DataParser.parseSearchResults(result, 'area');
      searchResults.push(...areas);
    }
    
    ThingsLogger.info("Search completed successfully", { 
      query: validatedQuery, 
      type: searchType, 
      count: searchResults.length 
    });
    
    return DataParser.createSuccessResponse({
      success: true,
      query: validatedQuery,
      type: searchType,
      count: searchResults.length,
      results: searchResults,
    });
  }

  async getUpcomingTodos(args) {
    // Validate inputs
    const validatedDays = args.days ? ThingsValidator.validateNumberInput(args.days, "days", 1, 365) : 7;
    const validatedLimit = args.limit ? ThingsValidator.validateNumberInput(args.limit, "limit", 1, 1000) : 50;
    const completed = Boolean(args.completed);

    ThingsLogger.info("Getting upcoming todos", { days: validatedDays, completed, limit: validatedLimit });

    const script = AppleScriptTemplates.getUpcomingTodos(validatedDays, completed);
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    const limitedTodos = todos.slice(0, validatedLimit);
    
    ThingsLogger.info("Retrieved upcoming todos successfully", { count: limitedTodos.length, total: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      days: validatedDays,
      completed_included: completed,
      count: limitedTodos.length,
      total_count: todos.length,
      todos: limitedTodos,
    });
  }

  async updateTodo(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    ThingsLogger.info("Updating to-do", { name: scriptParams.name });

    const scriptTemplate = AppleScriptTemplates.updateTodo(scriptParams);
    const result = await this.executeThingsScript(scriptTemplate, scriptParams, "Update todo");
    
    if (result.trim() === "not_found") {
      ThingsLogger.warn("Todo not found for update", { name: scriptParams.name });
      
      return DataParser.createSuccessResponse({
        success: false,
        message: `To-do not found: ${scriptParams.name}`,
        error: "TODO_NOT_FOUND"
      });
    }
    
    ThingsLogger.logAssignmentWarnings(scriptParams, "updated");
    ThingsLogger.info("To-do updated successfully", { name: scriptParams.name });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Updated to-do: ${scriptParams.name}`,
    });
  }

  /**
   * Generic status change operation for todos and projects
   */
  async changeItemStatus(args, itemType, newStatus, operation) {
    const validatedName = ThingsValidator.validateStringInput(args.name, "name");

    ThingsLogger.info(`${operation} ${itemType}`, { name: validatedName });

    const scriptTemplate = AppleScriptTemplates.changeItemStatus(itemType, newStatus);
    const script = AppleScriptSanitizer.buildScript(scriptTemplate, { name: validatedName });
    const result = await this.executeAppleScript(script);
    
    if (result.trim() === "not_found") {
      const errorType = itemType.toUpperCase() + "_NOT_FOUND";
      ThingsLogger.warn(`${itemType} not found for ${operation.toLowerCase()}`, { name: validatedName });
      
      return DataParser.createSuccessResponse({
        success: false,
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found: ${validatedName}`,
        error: errorType
      });
    }
    
    ThingsLogger.info(`${itemType} ${operation.toLowerCase()} successfully`, { name: validatedName });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `${operation} ${itemType}: ${validatedName}`,
    });
  }

  async cancelTodo(args) {
    return await this.changeItemStatus(args, "to-do", "canceled", "Canceled");
  }

  async cancelProject(args) {
    return await this.changeItemStatus(args, "project", "canceled", "Canceled");
  }

  /**
   * Generic delete operation for todos, projects, and areas
   */
  async deleteItem(args, itemType, displayName) {
    const validatedName = ThingsValidator.validateStringInput(args.name, "name");

    ThingsLogger.info(`Deleting ${displayName}`, { name: validatedName });

    const scriptTemplate = AppleScriptTemplates.deleteItem(itemType);
    const script = AppleScriptSanitizer.buildScript(scriptTemplate, { name: validatedName });
    const result = await this.executeAppleScript(script);
    
    if (result.trim() === "not_found") {
      const errorType = itemType.toUpperCase().replace("-", "_") + "_NOT_FOUND";
      ThingsLogger.warn(`${displayName} not found for deletion`, { name: validatedName });
      
      return DataParser.createSuccessResponse({
        success: false,
        message: `${displayName.charAt(0).toUpperCase() + displayName.slice(1)} not found: ${validatedName}`,
        error: errorType
      });
    }
    
    ThingsLogger.info(`${displayName} deleted successfully`, { name: validatedName });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Deleted ${displayName}: ${validatedName}`,
    });
  }

  async deleteTodo(args) {
    return await this.deleteItem(args, "to-do", "to-do");
  }

  async deleteProject(args) {
    return await this.deleteItem(args, "project", "project");
  }

  async deleteArea(args) {
    return await this.deleteItem(args, "area", "area");
  }

  async getTodosByStatus(args) {
    const validatedLimit = args.limit ? ThingsValidator.validateNumberInput(args.limit, "limit", 1, 1000) : 50;
    const list = args.list || "all";
    const status = args.status || "open";
    const validatedStatus = StatusValidator.validateStatus(status);
    const validatedList = StatusValidator.validateList(list);

    ThingsLogger.info("Getting todos by status", { status: validatedStatus, list: validatedList, limit: validatedLimit });

    const script = AppleScriptTemplates.getItemsByStatus("todos", validatedStatus, validatedList);
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    const limitedTodos = todos.slice(0, validatedLimit);
    
    ThingsLogger.info("Retrieved todos by status successfully", { count: limitedTodos.length, total: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      status: validatedStatus,
      list: validatedList,
      count: limitedTodos.length,
      total_count: todos.length,
      todos: limitedTodos,
    });
  }

  async getProjectsByStatus(args) {
    const validatedLimit = args.limit ? ThingsValidator.validateNumberInput(args.limit, "limit", 1, 1000) : 50;
    const validatedArea = args.area ? ThingsValidator.validateStringInput(args.area, "area") : null;
    const status = args.status || "open";
    const validatedStatus = StatusValidator.validateStatus(status);

    ThingsLogger.info("Getting projects by status", { status: validatedStatus, area: validatedArea, limit: validatedLimit });

    const script = AppleScriptTemplates.getItemsByStatus("projects", validatedStatus, null, validatedArea);
    const result = await this.executeAppleScript(script);
    const projects = DataParser.parseProjects(result);
    const limitedProjects = projects.slice(0, validatedLimit);
    
    ThingsLogger.info("Retrieved projects by status successfully", { count: limitedProjects.length, total: projects.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      status: validatedStatus,
      area: validatedArea || "all",
      count: limitedProjects.length,
      total_count: projects.length,
      projects: limitedProjects,
    });
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      // Only log startup message in debug mode to prevent stdio interference
      if (process.env.DEBUG === 'true') {
        console.error("Things DXT MCP server running on stdio");
      }
    } catch (error) {
      console.error("Failed to start MCP server:", error);
      process.exit(1);
    }
  }
}

const server = new ThingsExtension();
server.run().catch(error => {
  console.error("Critical error starting Things MCP server:", error);
  process.exit(1);
});