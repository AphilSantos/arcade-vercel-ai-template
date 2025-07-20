import '@arcadeai/arcadejs/shims/web';
import { Arcade, PermissionDeniedError } from '@arcadeai/arcadejs';
import { formatOpenAIToolNameToArcadeToolName } from './utils';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';
import { jsonSchema, type ToolSet } from 'ai';

type FormattedTool = {
  function: {
    name: string;
    parameters: any;
    description: string;
  };
};

type FormattedToolList = {
  items: FormattedTool[];
};

export type ExecuteToolResult = {
  result?: any;
  authResponse?: AuthorizationResponse;
  error?: string;
};

class ArcadeServer {
  private static instance: ArcadeServer;
  public readonly client: Arcade;

  private constructor() {
    const apiKey = process.env.ARCADE_API_KEY;
    if (!apiKey) {
      console.error('ARCADE_API_KEY is not set in environment variables');
      throw new Error('ARCADE_API_KEY is not set');
    }

    this.client = new Arcade({
      apiKey,
      baseURL: process.env.ARCADE_BASE_URL,
    });
  }

  public static getInstance(): ArcadeServer {
    if (!ArcadeServer.instance) {
      ArcadeServer.instance = new ArcadeServer();
    }
    return ArcadeServer.instance;
  }

  public async executeTool({
    toolName,
    args,
    userId,
  }: {
    toolName: string;
    args: any;
    userId: string;
  }): Promise<ExecuteToolResult> {
    const formattedToolName = formatOpenAIToolNameToArcadeToolName(toolName);

    try {
      const tool = await this.client.tools.get(formattedToolName);
      if (!tool) {
        return { error: 'Tool not found' };
      }

      const result = await this.client.tools.execute({
        tool_name: formattedToolName,
        input: args,
        user_id: userId,
      });

      return { result };
    } catch (error) {
      if (error instanceof PermissionDeniedError) {
        try {
          console.log(`[Auth] Starting authorization for ${formattedToolName}`);
          const authInfo = await this.client.tools.authorize({
            tool_name: formattedToolName,
            user_id: userId,
          });
          console.log(`[Auth] Authorization response:`, authInfo);
          return { authResponse: authInfo };
        } catch (authError) {
          console.error(`[Auth] Authorization failed for ${formattedToolName}:`, authError);
          return { error: `Authorization failed: ${authError instanceof Error ? authError.message : 'Unknown error'}` };
        }
      } else {
        console.error(`[Tool] Error executing ${formattedToolName}:`, error);

        // Handle specific error types for better debugging
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            return { error: 'Tool execution timed out. Please try again.' };
          }
          if (error.message.includes('network') || error.message.includes('fetch')) {
            return { error: 'Network error occurred. Please check your connection and try again.' };
          }
          return { error: `Tool execution failed: ${error.message}` };
        }

        return { error: 'Failed to execute tool' };
      }
    }
  }

  public async getTools({
    userId,
    toolkit,
  }: { userId: string; toolkit?: string }): Promise<ToolSet> {
    try {
      const arcadeTools = await this.client.tools.list({
        limit: 1000,
        ...(toolkit && { toolkit }),
      });

      const formattedTools = (await this.client.tools.formatted.list({
        limit: 1000,
        format: 'openai',
        ...(toolkit && { toolkit }),
      })) as FormattedToolList;

      // Create maps for arcadeTools and formattedTools using their names as keys
      const arcadeToolsMap = new Map(
        arcadeTools.items.map((tool) => [
          `${tool.toolkit.name}.${tool.name}`,
          tool,
        ]),
      );
      const formattedToolsMap = new Map(
        formattedTools.items.map((tool) => [
          formatOpenAIToolNameToArcadeToolName(tool.function.name),
          tool,
        ]),
      );

      // Traverse the arcadeToolsMap and create a valid ToolSet
      const tools: ToolSet = {};
      arcadeToolsMap.forEach((arcadeTool, name) => {
        const formattedTool = formattedToolsMap.get(name);
        const needsAuth = Boolean(arcadeTool.requirements?.authorization);
        if (formattedTool) {
          tools[formattedTool.function.name] = {
            parameters: jsonSchema(formattedTool.function.parameters),
            description: formattedTool.function.description,
            execute: needsAuth
              ? undefined
              : async (input: any) => {
                return await this.client.tools.execute({
                  tool_name: name,
                  input,
                  user_id: userId,
                });
              },
          };
        }
      });

      return tools;
    } catch (error) {
      console.error('Error in getTools', error);
      return {} as ToolSet;
    }
  }

  public async getToolkits(): Promise<string[]> {
    try {
      console.log('Fetching tools list from Arcade API...');
      const tools = await this.client.tools.list({
        limit: 1000,
      });

      console.log('Raw tools response:', JSON.stringify(tools, null, 2));

      if (!tools?.items) {
        console.error('Unexpected tools format:', tools);
        return [];
      }

      console.log(`Found ${tools.items.length} tools`);

      const toolkitSet = new Set<string>();
      for (const tool of tools.items) {
        if (tool?.toolkit?.name) {
          console.log(`Found toolkit: ${tool.toolkit.name} (tool: ${tool.name})`);
          toolkitSet.add(tool.toolkit.name);
        } else {
          console.log('Tool missing toolkit.name:', JSON.stringify(tool, null, 2));
        }
      }

      const result = Array.from(toolkitSet);
      console.log(`Returning ${result.length} unique toolkits:`, result);
      return result;
    } catch (error) {
      console.error('Error in getToolkits:', error);
      // Return an empty array instead of throwing to prevent unhandled promise rejections
      return [];
    }
  }

  public async getToolsByToolkits({
    userId,
    toolkits,
  }: { userId: string; toolkits: string[] }): Promise<ToolSet> {
    if (!toolkits || toolkits.length === 0) {
      return {} as ToolSet;
    }

    const tools: ToolSet = {};
    try {
      const toolkitPromises = toolkits.map((toolkit) =>
        this.getTools({ userId, toolkit }),
      );
      const toolkitResults = await Promise.all(toolkitPromises);

      for (const toolkitTools of toolkitResults) {
        Object.assign(tools, toolkitTools);
      }
      return tools;
    } catch (error) {
      console.error('Error fetching tools by toolkits:', error);
      return tools;
    }
  }
}

// Only create the instance if we're on the server side
const arcadeServer =
  typeof window === 'undefined' ? ArcadeServer.getInstance() : null;

export { arcadeServer };
