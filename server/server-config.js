/**
 * Server Configuration for Things 3 MCP Integration
 * 
 * This module contains server configuration constants and utilities.
 */

export const SERVER_CONFIG = {
  name: "things-dxt",
  version: "1.2.2",
  capabilities: {
    tools: {},
  },
  applescript: {
    timeout: 30000,
    maxBuffer: 256 * 1024, // 256KB max buffer - sufficient for typical AppleScript output
  },
};

export const ERROR_MESSAGES = {
  THINGS_NOT_RUNNING: "Things 3 is not running. Please launch Things 3 and try again.",
  APPLESCRIPT_TIMEOUT: "AppleScript execution timed out",
  APPLESCRIPT_FAILED: "Failed to execute AppleScript",
  THINGS_CHECK_FAILED: "Failed to check if Things 3 is running",
  TODO_NOT_FOUND: "TODO_NOT_FOUND",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  ITEM_NOT_FOUND: "ITEM_NOT_FOUND",
};

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};