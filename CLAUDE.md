# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
```bash
# Run comprehensive test suite
npm test

# Run individual test suites  
npm run test:validation      # Input validation tests
npm run test:parameter      # Parameter mapping tests  
npm run test:data-parser    # Data parsing tests
npm run test:applescript    # AppleScript scheduling tests

# Syntax validation
npm run validate
```

### Development & Debugging
```bash
# Start server in debug mode
DEBUG=true npm start

# Package extension for distribution
dxt pack .

# Run server normally
npm start
```

## Architecture Overview

This is a Claude Desktop Extension (DXT) that integrates with Things 3 task manager via AppleScript automation. The architecture follows a modular design with clear separation of concerns:

### Core Components

**`server/index.js`** - Main MCP server entry point
- Handles MCP protocol communication
- Manages AppleScript execution with proper escaping and timeouts
- Coordinates between tool handlers and AppleScript templates

**`server/tool-definitions.js`** - MCP tool schema definitions
- Defines all 21 available tools (add_todo, get_inbox, search_items, etc.)
- Specifies input parameters and validation schemas
- Maps user-friendly parameter names to internal representations

**`server/tool-handlers.js`** - Tool implementation logic
- Contains handler methods for each MCP tool
- Orchestrates parameter mapping, AppleScript execution, and response formatting
- Handles error cases and validation

**`server/applescript-templates.js`** - AppleScript generation
- Contains static methods that generate AppleScript code
- Critical: Uses `schedule` command for setting activation dates, not direct property assignment
- Handles Things 3's specific AppleScript syntax requirements

**`server/utils.js`** - Validation and utilities
- `ThingsValidator`: Input validation with security checks
- `ParameterMapper`: Maps user parameters to Things 3 internal terminology
- `AppleScriptSanitizer`: Prevents injection attacks via proper escaping
- `DateConverter`: Converts YYYY-MM-DD to AppleScript date format

**`server/data-parser.js`** - Response parsing
- Parses tab-separated AppleScript output into structured JSON
- Maps Things 3 internal field names to user-friendly names
- Handles todos, projects, areas, and search results

### Key Design Patterns

**Parameter Mapping**: User-friendly terms are mapped to Things 3 internal terminology:
- `when` (user) → `activation_date` (Things 3) = when scheduled to work on
- `deadline` (user) → `due_date` (Things 3) = when actually due

**AppleScript Execution Flow**:
1. User parameters → `ParameterMapper.validateAndMapParameters()`
2. Mapped parameters → `AppleScriptTemplates.{method}()`
3. Template + parameters → `AppleScriptSanitizer.buildScript()`
4. Script execution → `executeAppleScript()` with timeout and security
5. Raw output → `DataParser.parse{Type}()` → structured response

**Error Handling**: All errors are wrapped in `McpError` with appropriate error codes. AppleScript failures are caught and converted to user-friendly messages.

## Critical Implementation Details

### AppleScript Date Scheduling
- **Never** use `set activation date of item to date "..."` - this will fail
- **Always** use `schedule item for date "..."` command
- For creation: create item first, then schedule if needed
- For updates: use `schedule` command directly on existing item

### Object References
- Use `to do id "..."` not `first to do whose id "..."`
- Use `project id "..."` not `first project whose id "..."`
- The `whose` syntax causes parsing errors in AppleScript

### Security Considerations
- All user input goes through `ThingsValidator` to prevent injection
- AppleScript dangerous patterns are detected and rejected
- String escaping is handled by `AppleScriptSanitizer`
- AppleScript execution has timeouts and buffer limits

### Testing Strategy
- Unit tests cover validation, parameter mapping, and data parsing
- AppleScript template tests verify correct command generation
- No integration tests with actual Things 3 app
- Use `npm test` before committing changes

## Tool Development Pattern

To add a new tool:

1. Add schema to `TOOL_DEFINITIONS` array
2. Add handler method to `ToolHandlers` class
3. Add routing in `index.js` `getHandlerMethod()`
4. Add AppleScript template if needed
5. Add unit tests
6. Update documentation

## Version Bumping

When releasing a new version, update the version number in **all three** locations:

1. **`package.json`** - Update the `version` field
2. **`manifest.json`** - Update the `version` field
3. **`server/server-config.js`** - Update `SERVER_CONFIG.version`

```bash
# After updating all three files, repackage the extension:
dxt pack .
```

The packaged DXT file will be created at `things-dxt.dxt` with the new version number.

## Common Pitfalls

- Don't use `first ... whose id` syntax in AppleScript templates
- Don't try to set `activation_date` property directly
- Always validate user input through `ThingsValidator`
- AppleScript output is tab-separated - account for this in parsing
- Things 3 must be running for AppleScript to work
- Date formats must be YYYY-MM-DD from user, converted to "Month Day, Year" for AppleScript