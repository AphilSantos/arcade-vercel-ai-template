export const MAX_TOOLKITS = 6;

export const formatOpenAIToolNameToArcadeToolName = (toolName: string) => {
  return toolName.replaceAll('_', '.');
};

export const getToolkitNameByOpenAIToolName = (toolName: string) => {
  // The toolkit name is the first part of the tool name
  return toolName.split('_').shift()?.toLowerCase();
};
