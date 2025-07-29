/**
 * Utility classes for Things 3 MCP Server
 * 
 * Key Design Decisions:
 * - User-friendly parameter mapping: due_date (user) -> activation_date (Things), deadline (user) -> due_date (Things)
 * - Centralized validation and mapping via ParameterMapper
 * - Consistent error handling and logging patterns
 * - Clean separation of concerns between validation, scripting, and data parsing
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

export class ThingsValidator {
  static validateStringInput(input, fieldName, maxLength = 1000) {
    if (typeof input !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be a string`
      );
    }
    
    if (input.length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} cannot be empty`
      );
    }
    
    if (input.length > maxLength) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} cannot exceed ${maxLength} characters`
      );
    }
    
    // Allow quotes and apostrophes since AppleScriptSanitizer handles proper escaping
    // Only reject truly dangerous patterns like script injection attempts
    const dangerousPatterns = [
      /tell\s+application/i,    // Prevents: tell application "System Events" 
      /end\s+tell/i,            // Prevents: end tell (AppleScript block closure)
      /set\s+\w+\s+to/i,        // Prevents: set variable to malicious value
      /do\s+shell\s+script/i,   // Prevents: do shell script "rm -rf /"
      /osascript/i              // Prevents: osascript command injection
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `${fieldName} contains potentially dangerous script patterns`
        );
      }
    }
    
    return input.trim();
  }
  
  static validateArrayInput(input, fieldName, maxItems = 50) {
    if (!Array.isArray(input)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be an array`
      );
    }
    
    if (input.length > maxItems) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} cannot exceed ${maxItems} items`
      );
    }
    
    return input.map(item => this.validateStringInput(item, `${fieldName} item`, 100));
  }
  
  static validateDateInput(input, fieldName) {
    if (typeof input !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be a string in YYYY-MM-DD format`
      );
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be in YYYY-MM-DD format`
      );
    }
    
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} is not a valid date`
      );
    }
    
    return input;
  }
  
  static validateNumberInput(input, fieldName, min = 1, max = 1000) {
    if (typeof input !== 'number' || !Number.isInteger(input)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be an integer`
      );
    }
    
    if (input < min || input > max) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be between ${min} and ${max}`
      );
    }
    
    return input;
  }
}

export class DateConverter {
  /**
   * Convert YYYY-MM-DD date to AppleScript date format
   */
  static toAppleScriptDate(isoDate) {
    // Validate input format
    if (!isoDate || typeof isoDate !== 'string') {
      throw new Error('Date must be a non-empty string');
    }
    
    // Check YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(isoDate)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    
    const date = new Date(isoDate + 'T00:00:00');
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${isoDate}`);
    }
    
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Validate year range (AppleScript has limitations)
    if (year < 1904 || year > 2040) {
      throw new Error(`Year ${year} is outside AppleScript's supported range (1904-2040)`);
    }
    
    return `${month} ${day}, ${year}`;
  }
}

export class StatusValidator {
  /**
   * Valid status values for Things 3 items
   */
  static VALID_STATUSES = ["open", "completed", "canceled"];
  static VALID_LISTS = ["inbox", "today", "upcoming", "anytime", "someday", "all"];

  /**
   * Validate status parameter
   */
  static validateStatus(status, fieldName = "status") {
    if (!this.VALID_STATUSES.includes(status)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid ${fieldName}: ${status}. Must be one of: ${this.VALID_STATUSES.join(', ')}`
      );
    }
    return status;
  }

  /**
   * Validate list parameter
   */
  static validateList(list, fieldName = "list") {
    if (!this.VALID_LISTS.includes(list)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid ${fieldName}: ${list}. Must be one of: ${this.VALID_LISTS.join(', ')}`
      );
    }
    return list;
  }

  /**
   * Convert status to AppleScript filter
   */
  static statusToFilter(status) {
    switch(status) {
      case "open":
        return "status is open";
      case "completed":
        return "status is completed";
      case "canceled":
        return "status is canceled";
      default:
        return "status is open";
    }
  }
}

export class ParameterMapper {
  /**
   * Validate and map user-friendly parameters to internal parameters
   * Maps: when (user) -> activation_date (internal), deadline (user) -> due_date (internal)
   */
  static validateAndMapParameters(args, additionalFields = {}) {
    const result = {
      // Support both old (name) and new (title) parameter names for backward compatibility
      name: args.title ? ThingsValidator.validateStringInput(args.title, "title") : 
            (args.name ? ThingsValidator.validateStringInput(args.name, "name") : null),
      title: args.title ? ThingsValidator.validateStringInput(args.title, "title") : null,
      id: args.id ? ThingsValidator.validateStringInput(args.id, "id") : null,
      notes: args.notes ? ThingsValidator.validateStringInput(args.notes, "notes", 10000) : null,
      
      // Map user-friendly parameters to internal Things 3 parameters
      // User terminology -> Things 3 terminology:
      // - "when" (when to work on it) -> "activation_date" (Things 3 internal field)
      // - "deadline" (when it's due) -> "due_date" (Things 3 internal field)
      // Also supports legacy parameter names for backward compatibility
      activation_date: args.when ? ThingsValidator.validateDateInput(args.when, "when") : 
                      (args.due_date ? ThingsValidator.validateDateInput(args.due_date, "due_date") : null),
      due_date: args.deadline ? ThingsValidator.validateDateInput(args.deadline, "deadline") : null,
      
      // Area and project mappings
      area: args.area_title ? ThingsValidator.validateStringInput(args.area_title, "area_title") : 
            (args.area ? ThingsValidator.validateStringInput(args.area, "area") : null),
      area_id: args.area_id ? ThingsValidator.validateStringInput(args.area_id, "area_id") : null,
      project: args.list_title ? ThingsValidator.validateStringInput(args.list_title, "list_title") : 
               (args.project ? ThingsValidator.validateStringInput(args.project, "project") : null),
      list_id: args.list_id ? ThingsValidator.validateStringInput(args.list_id, "list_id") : null,
      
      // Additional fields
      tags: args.tags ? ThingsValidator.validateArrayInput(args.tags, "tags") : null,
      checklist_items: args.checklist_items ? ThingsValidator.validateArrayInput(args.checklist_items, "checklist_items") : null,
      todos: args.todos ? ThingsValidator.validateArrayInput(args.todos, "todos") : null,
      heading: args.heading ? ThingsValidator.validateStringInput(args.heading, "heading") : null,
      
      // Status flags
      completed: args.completed !== undefined ? Boolean(args.completed) : null,
      canceled: args.canceled !== undefined ? Boolean(args.canceled) : null,
      
      ...additionalFields
    };
    
    // Remove null values to keep the object clean
    return Object.fromEntries(Object.entries(result).filter(([_, v]) => v !== null));
  }
}

export class ParameterBuilder {
  /**
   * Build AppleScript parameters with tags and optional date formatting
   */
  static buildParameters(baseParams, tags = null, dueDate = null, activationDate = null) {
    const buildParams = { ...baseParams };
    
    // Add individual tag parameters
    if (tags && Array.isArray(tags)) {
      tags.forEach((tag, index) => {
        buildParams[`tag_${index}`] = tag;
      });
    }
    
    // Add individual todo parameters
    if (baseParams.todos && Array.isArray(baseParams.todos)) {
      baseParams.todos.forEach((todo, index) => {
        buildParams[`todo_${index}`] = todo;
      });
    }
    
    // Add formatted due date parameter
    if (dueDate) {
      try {
        buildParams.due_date_formatted = DateConverter.toAppleScriptDate(dueDate);
      } catch (error) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid due date: ${error.message}`
        );
      }
    }
    
    // Add formatted activation date parameter
    if (activationDate) {
      try {
        buildParams.activation_date_formatted = DateConverter.toAppleScriptDate(activationDate);
      } catch (error) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid activation date: ${error.message}`
        );
      }
    }
    
    return buildParams;
  }
}

export class AppleScriptSanitizer {
  /**
   * Sanitize a string for safe inclusion in AppleScript
   * @param {*} input - The input to sanitize (will be converted to string)
   * @returns {string} - Escaped string safe for AppleScript
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Escape dangerous characters for AppleScript
    // Order matters: backslashes must be escaped first
    // Note: Apostrophes don't need escaping inside double-quoted AppleScript strings
    return input
      .replace(/\\/g, '\\\\')     // Escape backslashes: \ -> \\
      .replace(/"/g, '\\"')       // Escape double quotes: " -> \"
      .replace(/\r?\n/g, '\\n')   // Convert newlines to \n
      .replace(/\t/g, '\\t');     // Convert tabs to \t
  }
  
  /**
   * Build an AppleScript from a template, safely replacing placeholders
   * @param {string} template - AppleScript template with {{placeholder}} markers
   * @param {Object} params - Parameters to replace in the template
   * @returns {string} - Complete AppleScript with sanitized parameters
   */
  static buildScript(template, params = {}) {
    let script = template;
    
    // Replace parameters safely
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      const sanitizedValue = this.sanitizeString(String(value));
      script = script.replace(new RegExp(placeholder, 'g'), sanitizedValue);
    }
    
    return script;
  }
}

export class ThingsLogger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    // Only log to stderr to avoid interfering with MCP communication
    // Reduce verbosity during normal operations to prevent stdio interference
    if (level === 'error' || process.env.DEBUG === 'true') {
      console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
    }
  }
  
  static info(message, data) {
    this.log('info', message, data);
  }
  
  static warn(message, data) {
    this.log('warn', message, data);
  }
  
  static error(message, data) {
    this.log('error', message, data);
  }
  
  static debug(message, data) {
    if (process.env.DEBUG === 'true') {
      this.log('debug', message, data);
    }
  }
  
  /**
   * Log warnings for project/area assignments that might not exist
   */
  static logAssignmentWarnings(scriptParams, operation = "created") {
    const itemName = scriptParams.title || scriptParams.name;
    if (scriptParams.project || scriptParams.list_title) {
      this.info(`Item ${operation} with project assignment`, { 
        name: itemName, 
        project: scriptParams.project || scriptParams.list_title,
        note: "If project doesn't exist, item will remain in current location"
      });
    }
    if (scriptParams.area || scriptParams.area_title) {
      this.info(`Item ${operation} with area assignment`, { 
        name: itemName, 
        area: scriptParams.area || scriptParams.area_title,
        note: "If area doesn't exist, item will remain in current location"
      });
    }
  }
}