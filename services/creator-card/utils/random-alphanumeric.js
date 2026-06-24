const crypto = require('crypto');

const CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a cryptographically-random lowercase alphanumeric string.
 * Used for slug suffixes (e.g. `cook-a8x2k1`).
 *
 * @param {Number} [length=6]
 * @returns {String}
 */
function randomAlphanumeric(length = 6) {
  const bytes = crypto.randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }

  return result;
}

module.exports = randomAlphanumeric;
