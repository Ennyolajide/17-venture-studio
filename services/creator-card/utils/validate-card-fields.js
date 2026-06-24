const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');

function isAlphanumeric(value) {
  if (!value.length) return false;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    const isLower = ch >= 'a' && ch <= 'z';
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isDigit = ch >= '0' && ch <= '9';
    if (!isLower && !isUpper && !isDigit) {
      return false;
    }
  }

  return true;
}

function hasValidSlugChars(value) {
  if (!value.length) return false;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    const isLower = ch >= 'a' && ch <= 'z';
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isDigit = ch >= '0' && ch <= '9';
    if (!isLower && !isUpper && !isDigit && ch !== '-' && ch !== '_') {
      return false;
    }
  }

  return true;
}

function isValidLinkUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Validates the field-level rules that the VSL validator cannot express
 * (character sets, URL prefixes, integer amounts). Every failure here is a
 * field-level validation error and returns HTTP 400.
 *
 * @param {Object} data - already VSL-validated payload
 */
function validateCardFields(data) {
  if (data.slug !== undefined && !hasValidSlugChars(data.slug)) {
    throwAppError(CreatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.VALIDATIONERR);
  }

  if (data.access_code !== undefined && !isAlphanumeric(data.access_code)) {
    throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.VALIDATIONERR);
  }

  if (Array.isArray(data.links)) {
    data.links.forEach((link) => {
      if (!isValidLinkUrl(link.url)) {
        throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.VALIDATIONERR);
      }
    });
  }

  if (data.service_rates) {
    const { rates } = data.service_rates;

    if (!Array.isArray(rates) || rates.length === 0) {
      throwAppError(CreatorCardMessages.EMPTY_SERVICE_RATES, ERROR_CODE.VALIDATIONERR);
    }

    rates.forEach((rate) => {
      if (!Number.isInteger(rate.amount) || rate.amount < 1) {
        throwAppError(CreatorCardMessages.INVALID_RATE_AMOUNT, ERROR_CODE.VALIDATIONERR);
      }
    });
  }
}

module.exports = validateCardFields;
