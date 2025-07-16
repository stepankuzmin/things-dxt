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
    
    // Basic sanitization - prevent AppleScript injection
    if (input.includes('"') || input.includes("'") || input.includes('\\')) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} contains invalid characters`
      );
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

export class ParameterMapper {
  /**
   * Validate and map user-friendly parameters to internal parameters
   * Maps: due_date (user) -> activation_date (internal), deadline (user) -> due_date (internal)
   */
  static validateAndMapParameters(args, additionalFields = {}) {
    const result = {
      name: args.name ? ThingsValidator.validateStringInput(args.name, "name") : null,
      new_name: args.new_name ? ThingsValidator.validateStringInput(args.new_name, "new_name") : null,
      notes: args.notes ? ThingsValidator.validateStringInput(args.notes, "notes", 10000) : null,
      
      // Map user-friendly parameters to internal parameters
      // due_date (user) -> activation_date (internal) 
      // deadline (user) -> due_date (internal)
      activation_date: args.due_date ? ThingsValidator.validateDateInput(args.due_date, "due_date") : null,
      due_date: args.deadline ? ThingsValidator.validateDateInput(args.deadline, "deadline") : null,
      
      project: args.project ? ThingsValidator.validateStringInput(args.project, "project") : null,
      area: args.area ? ThingsValidator.validateStringInput(args.area, "area") : null,
      tags: args.tags ? ThingsValidator.validateArrayInput(args.tags, "tags") : null,
      
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
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Escape dangerous characters for AppleScript
    return input
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n')
      .replace(/\t/g, '\\t');
  }
  
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
    if (scriptParams.project) {
      this.info(`To-do ${operation} with project assignment`, { 
        name: scriptParams.name, 
        project: scriptParams.project,
        note: "If project doesn't exist, todo will remain in current location"
      });
    }
    if (scriptParams.area) {
      this.info(`To-do ${operation} with area assignment`, { 
        name: scriptParams.name, 
        area: scriptParams.area,
        note: "If area doesn't exist, todo will remain in current location"
      });
    }
  }
}