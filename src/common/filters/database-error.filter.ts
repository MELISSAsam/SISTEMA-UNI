import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

/**
 * Global Database Error Filter
 * Catches database errors and returns user-friendly messages
 */
@Catch()
export class DatabaseErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(DatabaseErrorFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let service: string | null = null;

        // Handle HttpException
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || message;
        }
        // Handle Circuit Breaker errors
        else if (exception.message?.includes('Circuit breaker is OPEN')) {
            status = HttpStatus.SERVICE_UNAVAILABLE;

            if (exception.message.includes('AUTH')) {
                service = 'authentication';
                message = 'Authentication service temporarily unavailable. Please try again later.';
            } else if (exception.message.includes('CICLO-CARRERA')) {
                service = 'academic';
                message = 'Academic management service temporarily unavailable. Please try again later.';
            } else if (exception.message.includes('PROFESORES')) {
                service = 'professors';
                message = 'Professor management service temporarily unavailable. Please try again later.';
            } else {
                message = 'Service temporarily unavailable. Please try again later.';
            }
        }
        // Handle Prisma errors
        else if (exception.code) {
            status = HttpStatus.BAD_REQUEST;

            switch (exception.code) {
                case 'P2002':
                    message = 'A record with this unique field already exists';
                    break;
                case 'P2003':
                    message = 'Foreign key constraint failed';
                    break;
                case 'P2025':
                    message = 'Record not found';
                    status = HttpStatus.NOT_FOUND;
                    break;
                case 'P1001':
                case 'P1002':
                case 'P1008':
                case 'P1017':
                    status = HttpStatus.SERVICE_UNAVAILABLE;
                    message = 'Database connection error. Service temporarily unavailable.';
                    break;
                default:
                    message = 'Database operation failed';
            }
        }
        // Handle connection errors
        else if (this.isConnectionError(exception)) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = 'Database service temporarily unavailable. Please try again later.';
        }

        // Log the error
        this.logger.error(
            `${request.method} ${request.url} - Status: ${status} - ${exception.message}`,
            exception.stack,
        );

        // Send response
        response.status(status).json({
            statusCode: status,
            message,
            service,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }

    private isConnectionError(error: any): boolean {
        const connectionErrors = [
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'Connection terminated',
            'Connection closed',
        ];

        return connectionErrors.some(msg => error.message?.includes(msg));
    }
}
