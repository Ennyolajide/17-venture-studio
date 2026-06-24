const validator = require('@app-core/validator');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const serializeCard = require('./utils/serialize-card');
const throwBusinessError = require('./utils/throw-business-error');

const deleteCardSpec = `root { // Delete Creator Card
  slug string<trim|minLength:1>
  creator_reference string<trim|length:20>
}`;

const parsedDeleteCardSpec = validator.parse(deleteCardSpec);

/**
 * Deletes the Creator Card tied to a slug and returns it in the creation
 * response format with `deleted` set. Returns NF01 when the slug is unknown.
 * Soft deletion frees the slug for reuse and hides the card from retrieval.
 *
 * @param {Object} serviceData
 * @param {Object} [options]
 * @returns {Promise<Object>} serialized deleted card (includes access_code)
 */
async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedDeleteCardSpec);
  let response;

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug } });

    if (!card) {
      throwBusinessError('NF01', CreatorCardMessages.CARD_NOT_FOUND);
    }

    const deletedAt = Date.now();
    await CreatorCard.deleteOne({ query: { slug: data.slug } });

    response = serializeCard(card, { includeAccessCode: true, deleted: deletedAt });
  } catch (error) {
    appLogger.errorX(error, 'delete-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = deleteCreatorCard;
