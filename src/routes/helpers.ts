export const asyncHandler = fn => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

type TExtendError = Error & { status?: number };

export const createError = (status: number, message: string): TExtendError => {
  const error: TExtendError = new Error(message);
  error.status = status;

  return error;
};

export const parseSort = (sort: string, defaultSort: {[key: string]: 1 | -1}) => {
  if (!sort) {
    return defaultSort;
  }

  const [field, direction] = sort.split(',');

  if (!field) {
    return defaultSort;
  }

  const dir = direction === 'asc' ? 1 : -1;

  return {[field]: dir};
}
