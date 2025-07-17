/**
 * Tool Handlers for Things 3 MCP Integration
 * 
 * This module contains all the handler methods for MCP tools.
 * Each handler is responsible for executing the specific functionality
 * of its corresponding tool.
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ThingsValidator, ParameterMapper, ThingsLogger, AppleScriptSanitizer } from "./utils.js";
import { AppleScriptTemplates } from "./applescript-templates.js";
import { DataParser } from "./data-parser.js";

export class ToolHandlers {
  constructor(executeAppleScript, executeThingsScript) {
    this.executeAppleScript = executeAppleScript;
    this.executeThingsScript = executeThingsScript;
  }

  async addTodo(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    ThingsLogger.info("Creating to-do", { name: scriptParams.name || scriptParams.title });

    const scriptTemplate = AppleScriptTemplates.createTodo(scriptParams);
    const result = await this.executeThingsScript(scriptTemplate, scriptParams, "Create todo");
    
    ThingsLogger.logAssignmentWarnings(scriptParams, "created");
    ThingsLogger.info("To-do created successfully", { name: scriptParams.name || scriptParams.title, id: result });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Created to-do: ${scriptParams.name || scriptParams.title}`,
      id: result,
    });
  }

  async addProject(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    ThingsLogger.info("Creating project", { name: scriptParams.name || scriptParams.title });

    const scriptTemplate = AppleScriptTemplates.createProject(scriptParams);
    const result = await this.executeThingsScript(scriptTemplate, scriptParams, "Create project");
    
    if (scriptParams.area || scriptParams.area_title) {
      ThingsLogger.info("Project created with area assignment", { 
        name: scriptParams.name || scriptParams.title, 
        area: scriptParams.area || scriptParams.area_title,
        note: "If area doesn't exist, project will remain without area assignment"
      });
    }
    
    ThingsLogger.info("Project created successfully", { name: scriptParams.name || scriptParams.title, id: result });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Created project: ${scriptParams.name || scriptParams.title}`,
      id: result,
    });
  }

  async getAreas(args) {
    const includeItems = args.include_items !== undefined ? Boolean(args.include_items) : false;
    ThingsLogger.info("Getting areas", { includeItems });

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

  async getTodos(args) {
    const projectUuid = args.project_uuid;
    const includeItems = args.include_items !== undefined ? Boolean(args.include_items) : true;
    
    ThingsLogger.info("Getting todos", { projectUuid, includeItems });

    const script = AppleScriptTemplates.getItemsByStatus("todos", "open", "all");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    
    ThingsLogger.info("Retrieved todos successfully", { count: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getProjects(args) {
    const includeItems = args.include_items !== undefined ? Boolean(args.include_items) : false;
    
    ThingsLogger.info("Getting projects", { includeItems });

    const script = AppleScriptTemplates.getItemsByStatus("projects", "open", null, null);
    const result = await this.executeAppleScript(script);
    const projects = DataParser.parseProjects(result);
    
    ThingsLogger.info("Retrieved projects successfully", { count: projects.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: projects.length,
      projects: projects,
    });
  }

  async getInbox(args) {
    ThingsLogger.info("Getting inbox todos");

    const script = AppleScriptTemplates.getItemsByStatus("todos", "open", "inbox");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    
    ThingsLogger.info("Retrieved inbox todos successfully", { count: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getToday(args) {
    ThingsLogger.info("Getting today todos");

    const script = AppleScriptTemplates.getItemsByStatus("todos", "open", "today");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    
    ThingsLogger.info("Retrieved today todos successfully", { count: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getUpcoming(args) {
    ThingsLogger.info("Getting upcoming todos");

    const script = AppleScriptTemplates.getItemsByStatus("todos", "open", "upcoming");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    
    ThingsLogger.info("Retrieved upcoming todos successfully", { count: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getAnytime(args) {
    ThingsLogger.info("Getting anytime todos");

    const script = AppleScriptTemplates.getItemsByStatus("todos", "open", "anytime");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    
    ThingsLogger.info("Retrieved anytime todos successfully", { count: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getSomeday(args) {
    ThingsLogger.info("Getting someday todos");

    const script = AppleScriptTemplates.getItemsByStatus("todos", "open", "someday");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    
    ThingsLogger.info("Retrieved someday todos successfully", { count: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getLogbook(args) {
    const period = args.period || "7d";
    const limit = args.limit || 50;
    
    ThingsLogger.info("Getting logbook todos", { period, limit });

    const script = AppleScriptTemplates.getItemsByStatus("todos", "completed", "all");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    const limitedTodos = todos.slice(0, limit);
    
    ThingsLogger.info("Retrieved logbook todos successfully", { count: limitedTodos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      period: period,
      count: limitedTodos.length,
      todos: limitedTodos,
    });
  }

  async getTrash(args) {
    ThingsLogger.info("Getting trashed todos");

    const script = AppleScriptTemplates.getItemsByStatus("todos", "canceled", "all");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    
    ThingsLogger.info("Retrieved trashed todos successfully", { count: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getTags(args) {
    ThingsLogger.info("Getting tags");

    const script = `
      tell application "Things3"
        set tagList to {}
        repeat with aTag in tags
          set end of tagList to name of aTag
        end repeat
        return my listToString(tagList)
      end tell
      
      on listToString(lst)
        set AppleScript's text item delimiters to "\\n"
        set theString to lst as string
        set AppleScript's text item delimiters to ""
        return theString
      end listToString
    `;
    
    const result = await this.executeAppleScript(script);
    const tags = result.split('\n').filter(tag => tag.trim() !== '');
    
    ThingsLogger.info("Retrieved tags successfully", { count: tags.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      count: tags.length,
      tags: tags,
    });
  }

  async getTaggedItems(args) {
    const tagTitle = ThingsValidator.validateStringInput(args.tag_title, "tag_title");
    
    ThingsLogger.info("Getting tagged items", { tagTitle });

    const script = AppleScriptSanitizer.buildScript(`
      tell application "Things3"
        set itemList to {}
        repeat with aTodo in to dos
          repeat with aTag in tags of aTodo
            if name of aTag is "{{tag_title}}" then
              set end of itemList to name of aTodo
              exit repeat
            end if
          end repeat
        end repeat
        return my listToString(itemList)
      end tell
      
      on listToString(lst)
        set AppleScript's text item delimiters to "\\n"
        set theString to lst as string
        set AppleScript's text item delimiters to ""
        return theString
      end listToString
    `, { tag_title: tagTitle });
    
    const result = await this.executeAppleScript(script);
    const items = result.split('\n').filter(item => item.trim() !== '');
    
    ThingsLogger.info("Retrieved tagged items successfully", { count: items.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      tag: tagTitle,
      count: items.length,
      items: items,
    });
  }

  async searchTodos(args) {
    const validatedQuery = ThingsValidator.validateStringInput(args.query, "query");
    
    ThingsLogger.info("Searching todos", { query: validatedQuery });

    const todoScript = AppleScriptTemplates.searchTodos(validatedQuery);
    const script = AppleScriptSanitizer.buildScript(todoScript, { query: validatedQuery });
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseSearchResults(result, 'todo');
    
    ThingsLogger.info("Todo search completed successfully", { 
      query: validatedQuery, 
      count: todos.length 
    });
    
    return DataParser.createSuccessResponse({
      success: true,
      query: validatedQuery,
      count: todos.length,
      todos: todos,
    });
  }

  async searchAdvanced(args) {
    const validatedQuery = ThingsValidator.validateStringInput(args.query, "query");
    const tags = args.tags || [];
    const completed = args.completed || false;
    const canceled = args.canceled || false;
    const trashed = args.trashed || false;
    
    ThingsLogger.info("Advanced search", { query: validatedQuery, tags, completed, canceled, trashed });

    // This is a simplified implementation - a full implementation would need more complex AppleScript
    return await this.searchItems({ query: validatedQuery });
  }

  async getRecent(args) {
    const days = args.days || 7;
    
    ThingsLogger.info("Getting recent items", { days });

    // This is a simplified implementation - would need AppleScript to filter by modification date
    const script = AppleScriptTemplates.getItemsByStatus("todos", "open", "all");
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseTodos(result);
    
    ThingsLogger.info("Retrieved recent items successfully", { count: todos.length });
    
    return DataParser.createSuccessResponse({
      success: true,
      days: days,
      count: todos.length,
      items: todos,
    });
  }

  async updateTodo(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    if (!scriptParams.id) {
      throw new McpError(ErrorCode.InvalidParams, "Todo ID is required for update");
    }
    
    ThingsLogger.info("Updating to-do", { id: scriptParams.id });

    const scriptTemplate = AppleScriptTemplates.updateTodo(scriptParams);
    const result = await this.executeThingsScript(scriptTemplate, scriptParams, "Update todo");
    
    if (result.trim() === "not_found") {
      ThingsLogger.warn("Todo not found for update", { id: scriptParams.id });
      
      return DataParser.createSuccessResponse({
        success: false,
        message: `To-do not found: ${scriptParams.id}`,
        error: "TODO_NOT_FOUND"
      });
    }
    
    ThingsLogger.logAssignmentWarnings(scriptParams, "updated");
    ThingsLogger.info("To-do updated successfully", { id: scriptParams.id });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Updated to-do: ${scriptParams.id}`,
    });
  }

  async updateProject(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    if (!scriptParams.id) {
      throw new McpError(ErrorCode.InvalidParams, "Project ID is required for update");
    }
    
    ThingsLogger.info("Updating project", { id: scriptParams.id });

    // This will need a new AppleScript template for updating by ID
    const scriptTemplate = AppleScriptTemplates.updateProject ? 
      AppleScriptTemplates.updateProject(scriptParams) :
      AppleScriptTemplates.updateTodo(scriptParams); // Fallback to updateTodo template
    
    const result = await this.executeThingsScript(scriptTemplate, scriptParams, "Update project");
    
    if (result.trim() === "not_found") {
      ThingsLogger.warn("Project not found for update", { id: scriptParams.id });
      
      return DataParser.createSuccessResponse({
        success: false,
        message: `Project not found: ${scriptParams.id}`,
        error: "PROJECT_NOT_FOUND"
      });
    }
    
    ThingsLogger.logAssignmentWarnings(scriptParams, "updated");
    ThingsLogger.info("Project updated successfully", { id: scriptParams.id });
    
    return DataParser.createSuccessResponse({
      success: true,
      message: `Updated project: ${scriptParams.id}`,
    });
  }

  async showItem(args) {
    const itemId = ThingsValidator.validateStringInput(args.id, "id");
    
    ThingsLogger.info("Showing item", { id: itemId });

    const script = AppleScriptSanitizer.buildScript(`
      tell application "Things3"
        try
          set theItem to to do id "{{id}}"
          return "Found: " & name of theItem
        on error
          return "not_found"
        end try
      end tell
    `, { id: itemId });
    
    const result = await this.executeAppleScript(script);
    
    if (result.trim() === "not_found") {
      ThingsLogger.warn("Item not found", { id: itemId });
      
      return DataParser.createSuccessResponse({
        success: false,
        message: `Item not found: ${itemId}`,
        error: "ITEM_NOT_FOUND"
      });
    }
    
    ThingsLogger.info("Item found successfully", { id: itemId });
    
    return DataParser.createSuccessResponse({
      success: true,
      id: itemId,
      details: result,
    });
  }

  async searchItems(args) {
    const validatedQuery = ThingsValidator.validateStringInput(args.query, "query");

    ThingsLogger.info("Searching items", { query: validatedQuery });

    let searchResults = [];
    
    // Search todos
    const todoScript = AppleScriptTemplates.searchTodos(validatedQuery);
    const script = AppleScriptSanitizer.buildScript(todoScript, { query: validatedQuery });
    const result = await this.executeAppleScript(script);
    const todos = DataParser.parseSearchResults(result, 'todo');
    searchResults.push(...todos);
    
    // Search projects
    const projectScript = AppleScriptTemplates.searchProjects(validatedQuery);
    const projectScriptBuilt = AppleScriptSanitizer.buildScript(projectScript, { query: validatedQuery });
    const projectResult = await this.executeAppleScript(projectScriptBuilt);
    const projects = DataParser.parseSearchResults(projectResult, 'project');
    searchResults.push(...projects);
    
    // Search areas
    const areaScript = AppleScriptTemplates.searchAreas(validatedQuery);
    const areaScriptBuilt = AppleScriptSanitizer.buildScript(areaScript, { query: validatedQuery });
    const areaResult = await this.executeAppleScript(areaScriptBuilt);
    const areas = DataParser.parseSearchResults(areaResult, 'area');
    searchResults.push(...areas);
    
    ThingsLogger.info("Search completed successfully", { 
      query: validatedQuery, 
      count: searchResults.length 
    });
    
    return DataParser.createSuccessResponse({
      success: true,
      query: validatedQuery,
      count: searchResults.length,
      results: searchResults,
    });
  }
}