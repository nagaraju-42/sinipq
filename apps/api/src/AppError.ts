export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(message: string, statusCode: number, code: string, details?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Captures the stack trace for easier debugging
    Error.captureStackTrace(this, this.constructor);
  }
}