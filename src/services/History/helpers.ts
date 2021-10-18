export const getDatesLastMonth = (days = 30) => {
  const DAY = 3600 * 24 * 1000;

  return [...new Array(days)].map(
    (d, idx) => new Date(Date.now() - DAY * idx).toISOString().split('T')[0] + 'T00:00:00Z'
  );
};
