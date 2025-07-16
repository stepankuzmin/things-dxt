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
import { ThingsValidator, AppleScriptSanitizer, ThingsLogger, DateConverter, ParameterBuilder, ParameterMapper } from "./utils.js";
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
            name: "get_todos",
            description: "Get to-do items from Things",
            inputSchema: {
              type: "object",
              properties: {
                list: {
                  type: "string",
                  enum: ["inbox", "today", "upcoming", "anytime", "someday"],
                  description: "Which list to get to-dos from",
                },
                completed: {
                  type: "boolean",
                  description: "Whether to include completed to-dos",
                  default: false,
                },
                limit: {
                  type: "number",
                  description: "Maximum number of to-dos to return",
                  default: 50,
                },
              },
              required: ["list"],
            },
          },
          {
            name: "get_projects",
            description: "Get projects from Things",
            inputSchema: {
              type: "object",
              properties: {
                area: {
                  type: "string",
                  description: "Optional area name to filter projects",
                },
                completed: {
                  type: "boolean",
                  description: "Whether to include completed projects",
                  default: false,
                },
              },
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
          case "get_todos":
            return await this.getTodos(args);
          case "get_projects":
            return await this.getProjects(args);
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

  async getTodos(args) {
    // Validate inputs
    const validatedLimit = args.limit ? ThingsValidator.validateNumberInput(args.limit, "limit", 1, 1000) : 50;
    const completed = Boolean(args.completed);

    // Validate list parameter
    const validLists = ["inbox", "today", "upcoming", "anytime", "someday"];
    if (!validLists.includes(args.list)) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid list: ${args.list}. Must be one of: ${validLists.join(', ')}`);
    }

    ThingsLogger.info("Getting todos", { list: args.list, completed, limit: validatedLimit });

    const script = AppleScriptTemplates.getTodos(args.list, completed);
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    const limitedTodos = todos.slice(0, validatedLimit);
    
    ThingsLogger.info("Retrieved todos successfully", { count: limitedTodos.length, total: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      list: args.list,
      completed_included: completed,
      count: limitedTodos.length,
      total_count: todos.length,
      todos: limitedTodos,
    });
  }

  async getProjects(args) {
    // Validate inputs
    const validatedArea = args.area ? ThingsValidator.validateStringInput(args.area, "area") : null;
    const completed = Boolean(args.completed);

    ThingsLogger.info("Getting projects", { area: validatedArea, completed });

    const script = AppleScriptTemplates.getProjects(validatedArea, completed);
    const result = await this.executeAppleScript(script);
    const projects = DataParser.parseProjects(result);
    
    // Log a warning if no projects found and area was specified (might not exist)
    if (projects.length === 0 && validatedArea) {
      ThingsLogger.warn("No projects found for specified area", { 
        area: validatedArea, 
        message: "Area may not exist in Things 3" 
      });
    }
    
    ThingsLogger.info("Retrieved projects successfully", { 
      count: projects.length, 
      area: validatedArea,
      completed: completed 
    });
    
    return DataParser.createSuccessResponse({
      success: true,
      area: validatedArea || "all",
      completed_included: completed,
      count: projects.length,
      projects: projects,
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
    // Validate input
    const validatedName = ThingsValidator.validateStringInput(args.name, "name");

    ThingsLogger.info("Completing todo", { name: validatedName });

    const scriptTemplate = AppleScriptTemplates.completeTodo(validatedName);
    const script = AppleScriptSanitizer.buildScript(scriptTemplate, { name: validatedName });
    const result = await this.executeAppleScript(script);
    
    if (result.trim() === "not_found") {
      ThingsLogger.warn("Todo not found for completion", { name: validatedName });
      
      return DataParser.createSuccessResponse({
        success: false,
        message: `To-do not found: ${validatedName}`,
        error: "TODO_NOT_FOUND"
      });
    }
    
    ThingsLogger.info("Todo completed successfully", { name: validatedName });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Completed to-do: ${validatedName}`,
    });
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