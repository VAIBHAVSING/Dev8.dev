export enum ErrorCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  CONFLICT = 'CONFLICT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCodes,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function createErrorResponse(
  statusCode: number,
  code: ErrorCodes,
  message: string
) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    { status: statusCode }
  );
}

export function handleAPIError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return createErrorResponse(error.statusCode, error.code, error.message);
  }

  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(401, ErrorCodes.UNAUTHORIZED, 'Authentication required');
    }
    return createErrorResponse(500, ErrorCodes.INTERNAL_ERROR, error.message);
  }

  return createErrorResponse(500, ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred');
}
