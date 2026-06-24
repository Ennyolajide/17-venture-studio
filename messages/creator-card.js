module.exports = {
  // Business-rule errors (carry custom domain codes)
  SLUG_TAKEN: 'Slug is already taken',
  ACCESS_CODE_REQUIRED: 'access_code is required when access_type is private',
  ACCESS_CODE_NOT_ALLOWED: 'access_code can only be set on private cards',
  CARD_NOT_FOUND: 'Creator card not found',
  CARD_IS_DRAFT: 'Creator card not found',
  PRIVATE_CARD_CODE_REQUIRED: 'This card is private. An access code is required',
  INVALID_ACCESS_CODE: 'Invalid access code',

  // Field-level errors the VSL validator cannot express (return HTTP 400)
  INVALID_SLUG_FORMAT: 'slug may only contain letters, numbers, hyphens (-) and underscores (_)',
  INVALID_ACCESS_CODE_FORMAT: 'access_code must be exactly 6 alphanumeric characters',
  INVALID_LINK_URL: 'each link url must start with http:// or https://',
  EMPTY_SERVICE_RATES: 'service_rates.rates must be a non-empty array',
  INVALID_RATE_AMOUNT: 'service rate amount must be a positive integer in minor units',
};
