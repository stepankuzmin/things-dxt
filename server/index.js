#!/usr/bin/env node

/**
 * Things 3 MCP Server - Main Entry Point
 * 
 * This server provides MCP tools for creating, updating, and managing items in Things 3.
 * Key features:
 * - User-friendly date parameter mapping (when = when to work on, deadline = when actually due)
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

import { ThingsLogger, ParameterBuilder, AppleScriptSanitizer } from "./utils.js";
import { AppleScriptTemplates } from "./applescript-templates.js";
import { TOOL_DEFINITIONS } from "./tool-definitions.js";
import { ToolHandlers } from "./tool-handlers.js";
import { SERVER_CONFIG, ERROR_MESSAGES } from "./server-config.js";

const execAsync = promisify(exec);

class ThingsExtension {
  constructor() {
    try {
      this.server = new Server(
        {
          name: SERVER_CONFIG.name,
          version: SERVER_CONFIG.version,
        },
        {
          capabilities: SERVER_CONFIG.capabilities,
        }
      );

      // Initialize tool handlers with bound methods
      this.toolHandlers = new ToolHandlers(
        this.executeAppleScript.bind(this),
        this.executeThingsScript.bind(this)
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
        name: scriptParams.name || scriptParams.title,
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

  async executeAppleScript(script, timeout = SERVER_CONFIG.applescript.timeout) {
    try {
      ThingsLogger.debug("Executing AppleScript", { scriptLength: script.length });
      
      // Use double quotes for shell command to avoid conflicts with AppleScript single quote escaping
      const escapedScript = script.replace(/"/g, '\\"');
      const command = `osascript -e "${escapedScript}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        maxBuffer: SERVER_CONFIG.applescript.maxBuffer,
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
          ERROR_MESSAGES.APPLESCRIPT_TIMEOUT
        );
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `${ERROR_MESSAGES.APPLESCRIPT_FAILED}: ${error.message}`
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
          ERROR_MESSAGES.THINGS_NOT_RUNNING
        );
      }
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        ERROR_MESSAGES.THINGS_CHECK_FAILED
      );
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: TOOL_DEFINITIONS,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.validateThingsRunning();

        // Route to appropriate handler method
        const handlerMethod = this.getHandlerMethod(name);
        if (!handlerMethod) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        return await handlerMethod.call(this.toolHandlers, args);
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

  getHandlerMethod(toolName) {
    const handlerMap = {
      "add_todo": this.toolHandlers.addTodo,
      "add_project": this.toolHandlers.addProject,
      "get_areas": this.toolHandlers.getAreas,
      "get_todos": this.toolHandlers.getTodos,
      "get_projects": this.toolHandlers.getProjects,
      "get_inbox": this.toolHandlers.getInbox,
      "get_today": this.toolHandlers.getToday,
      "get_upcoming": this.toolHandlers.getUpcoming,
      "get_anytime": this.toolHandlers.getAnytime,
      "get_someday": this.toolHandlers.getSomeday,
      "get_logbook": this.toolHandlers.getLogbook,
      "get_trash": this.toolHandlers.getTrash,
      "get_tags": this.toolHandlers.getTags,
      "get_tagged_items": this.toolHandlers.getTaggedItems,
      "search_todos": this.toolHandlers.searchTodos,
      "search_advanced": this.toolHandlers.searchAdvanced,
      "get_recent": this.toolHandlers.getRecent,
      "update_todo": this.toolHandlers.updateTodo,
      "update_project": this.toolHandlers.updateProject,
      "show_item": this.toolHandlers.showItem,
      "search_items": this.toolHandlers.searchItems,
    };

    return handlerMap[toolName];
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