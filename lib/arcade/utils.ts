export const MAX_TOOLKITS_FREE = 6;
export const MAX_TOOLKITS_PREMIUM = 42; // Premium users can select up to 20 toolkits

// Legacy export for backward compatibility
export const MAX_TOOLKITS = MAX_TOOLKITS_FREE;

export const formatOpenAIToolNameToArcadeToolName = (toolName: string) => {
  return toolName.replaceAll('_', '.');
};

export const getToolkitNameByOpenAIToolName = (toolName: string) => {
  // The toolkit name is the first part of the tool name
  return toolName.split('_').shift()?.toLowerCase();
};

export const getMaxToolkitsForPlan = (plan: 'free' | 'paid'): number => {
  return plan === 'paid' ? MAX_TOOLKITS_PREMIUM : MAX_TOOLKITS_FREE;
};
