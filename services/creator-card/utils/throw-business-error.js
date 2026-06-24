const { throwAppError } = require('@app-core/errors');

/**
 * Catalog of Creator Card business-rule error codes and the HTTP status each
 * must produce. These domain codes are intentionally distinct from the generic
 * framework ERROR_CODE set, so we pass the HTTP status explicitly.
 */
const BUSINESS_ERROR = {
  SL02: { code: 'SL02', httpStatusCode: 400 }, // Slug already taken
  AC01: { code: 'AC01', httpStatusCode: 400 }, // access_code required (private)
  AC05: { code: 'AC05', httpStatusCode: 400 }, // access_code set on public card
  NF01: { code: 'NF01', httpStatusCode: 404 }, // Card not found
  NF02: { code: 'NF02', httpStatusCode: 404 }, // Card exists but is a draft
  AC03: { code: 'AC03', httpStatusCode: 403 }, // Access code required to view
  AC04: { code: 'AC04', httpStatusCode: 403 }, // Invalid access code
};

/**
 * Throws an application error tagged with a Creator Card domain code and the
 * correct HTTP status. Delegates to the template's `throwAppError` utility.
 *
 * @param {keyof typeof BUSINESS_ERROR} codeKey
 * @param {String} message
 */
function throwBusinessError(codeKey, message) {
  const entry = BUSINESS_ERROR[codeKey];

  throwAppError(message, entry.code, { httpStatusCode: entry.httpStatusCode });
}

module.exports = throwBusinessError;
