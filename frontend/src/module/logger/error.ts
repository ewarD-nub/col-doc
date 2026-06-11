export const typecastError = (
  error: unknown,
  fallbackString?: string,
): Error => {
  try {
    if (typeof error === 'string') {
      return new Error(error);
    }
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'object') {
      return new Error(JSON.stringify(error));
    }

    return new Error(fallbackString ?? 'unhandled error', { cause: error });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return new Error('Error when typecasting error');
  }
};
