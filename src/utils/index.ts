type TExtendError = Error & { status?: number };

export const createError = (status: number, message: string): TExtendError => {
  const error: TExtendError = new Error(message);
  error.status = status;

  return error;
};
