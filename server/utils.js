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

export class ParameterBuilder {
  /**
   * Build AppleScript parameters with tags and optional date formatting
   */
  static buildParameters(baseParams, tags = null, dueDate = null) {
    const buildParams = { ...baseParams };
    
    // Add individual tag parameters
    if (tags && Array.isArray(tags)) {
      tags.forEach((tag, index) => {
        buildParams[`tag_${index}`] = tag;
      });
    }
    
    // Add formatted date parameter
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
}