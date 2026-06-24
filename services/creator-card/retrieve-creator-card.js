const validator = require('@app-core/validator');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const serializeCard = require('./utils/serialize-card');
const throwBusinessError = require('./utils/throw-business-error');

const retrieveCardSpec = `root { // Retrieve Creator Card
  slug string<trim|minLength:1>
  access_code? any
}`;

const parsedRetrieveCardSpec = validator.parse(retrieveCardSpec);

/**
 * Publicly retrieves a Creator Card by slug, enforcing (in order):
 *   NF01 -> not found, NF02 -> draft, AC03 -> private without code,
 *   AC04 -> private with wrong code. Soft-deleted cards are treated as NF01.
 * The `access_code` field is never exposed in the response.
 *
 * @param {Object} serviceData
 * @param {Object} [options]
 * @returns {Promise<Object>} serialized card (no access_code)
 */
async function retrieveCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedRetrieveCardSpec);
  let response;

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug } });

    if (!card) {
      throwBusinessError('NF01', CreatorCardMessages.CARD_NOT_FOUND);
    }

    if (card.status === 'draft') {
      throwBusinessError('NF02', CreatorCardMessages.CARD_IS_DRAFT);
    }

    if (card.access_type === 'private') {
      const suppliedCode = data.access_code;

      if (suppliedCode === undefined || suppliedCode === null || suppliedCode === '') {
        throwBusinessError('AC03', CreatorCardMessages.PRIVATE_CARD_CODE_REQUIRED);
      }

      if (String(suppliedCode) !== card.access_code) {
        throwBusinessError('AC04', CreatorCardMessages.INVALID_ACCESS_CODE);
      }
    }

    response = serializeCard(card, { includeAccessCode: false });
  } catch (error) {
    appLogger.errorX(error, 'retrieve-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = retrieveCreatorCard;
