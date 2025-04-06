/**
 * @file Application Error module.
 * @module utils/appError
 */

/**
 * Class representing an application error.
 * @extends Error
 */
class appError extends Error {
    /**
     * Create an application error.
     * @param {string} message - The error message.
     * @param {number} statusCode - The HTTP status code.
     */
    constructor (message, statusCode){
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default appError;