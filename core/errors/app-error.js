/**
 * Throw an app error
 * @param {String} errorMessage
 * @param {String} [errorCode]
 * @param {{context:any, details:any, httpStatusCode:number}} [options]
 */
function appError(errorMessage, errorCode = 'ERR', options = {}) {
  const error = new Error(errorMessage);
  error.isApplicationError = true;
  error.errorCode = errorCode;

  if (options.context) {
    error.context = options.context;
  }

  if (options.details) {
    error.details = options.details;
  }

  // Optional explicit HTTP status override for business errors whose code is not
  // part of the generic ERROR_STATUS_CODE_MAPPING (e.g. domain codes like NF01/AC03).
  if (options.httpStatusCode) {
    error.httpStatusCode = options.httpStatusCode;
  }

  throw error;
}

module.exports = appError;
