const MAX_SLUG_LENGTH = 50;

function isWhitespace(ch) {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v';
}

function isSlugKeepChar(ch) {
  const isLower = ch >= 'a' && ch <= 'z';
  const isDigit = ch >= '0' && ch <= '9';
  return isLower || isDigit || ch === '_';
}

/**
 * Builds a base slug from a title using only string operations (no regex):
 *   1. lowercase the title
 *   2. replace whitespace with hyphens (consecutive separators collapse to one)
 *   3. drop any character that is not a letter, number, hyphen or underscore
 *
 * The result is trimmed of leading/trailing hyphens and capped at 50 chars.
 * It may be shorter than 5 characters - the caller decides when to append a
 * random suffix.
 *
 * @param {String} title
 * @returns {String}
 */
function generateSlug(title) {
  const lowered = String(title).toLowerCase();
  let slug = '';
  let prevHyphen = false;

  for (let i = 0; i < lowered.length; i++) {
    const ch = lowered[i];

    if (isSlugKeepChar(ch)) {
      slug += ch;
      prevHyphen = false;
    } else if (isWhitespace(ch) || ch === '-') {
      // collapse whitespace/hyphen runs, never lead with a hyphen
      if (!prevHyphen && slug.length > 0) {
        slug += '-';
        prevHyphen = true;
      }
    }
    // every other character is removed
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    slug = slug.slice(0, MAX_SLUG_LENGTH);
  }

  while (slug.endsWith('-')) {
    slug = slug.slice(0, -1);
  }

  return slug;
}

generateSlug.MAX_SLUG_LENGTH = MAX_SLUG_LENGTH;

module.exports = generateSlug;
