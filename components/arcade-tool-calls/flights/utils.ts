export const formatTime = (dateTimeString: string) => {
  return new Date(dateTimeString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const formatDate = (dateTimeString: string) => {
  return new Date(dateTimeString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
};

export const getEmissionsLabel = (diff: number | undefined) => {
  if (diff === undefined) return null;
  if (diff <= -15) return 'Much lower emissions';
  if (diff < 0) return 'Lower emissions';
  if (diff === 0) return 'Average emissions';
  if (diff <= 15) return 'Higher emissions';
  return 'Much higher emissions';
};

export const getEmissionsColor = (diff: number | undefined) => {
  if (diff === undefined)
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  if (diff <= -15)
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300';
  if (diff < 0)
    return 'bg-green-50 text-green-700 dark:bg-green-900 dark:bg-opacity-20 dark:text-green-400';
  if (diff === 0)
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  if (diff <= 15)
    return 'bg-amber-50 text-amber-700 dark:bg-amber-900 dark:bg-opacity-20 dark:text-amber-400';
  return 'bg-red-50 text-red-700 dark:bg-red-900 dark:bg-opacity-20 dark:text-red-400';
};
