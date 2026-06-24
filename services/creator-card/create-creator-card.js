const validator = require('@app-core/validator');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const generateSlug = require('./utils/generate-slug');
const randomAlphanumeric = require('./utils/random-alphanumeric');
const serializeCard = require('./utils/serialize-card');
const validateCardFields = require('./utils/validate-card-fields');
const throwBusinessError = require('./utils/throw-business-error');

const { MAX_SLUG_LENGTH } = generateSlug;
const SUFFIX_LENGTH = 6;
const MAX_SLUG_ATTEMPTS = 5;

// Field-level validation handled by the template's VSL validator. Business
// rules (slug uniqueness, conditional access_code) are enforced below.
const createCardSpec = `root { // Create Creator Card
  title string<trim|lengthBetween:3,100>
  description? string<trim|maxLength:500>
  slug? string<trim|lengthBetween:5,50>
  creator_reference string<trim|length:20>
  links[]? {
    title string<trim|lengthBetween:1,100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|lengthBetween:3,100>
      description? string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6>
}`;

const parsedCreateCardSpec = validator.parse(createCardSpec);

function buildSuffixedSlug(base) {
  const suffix = randomAlphanumeric(SUFFIX_LENGTH);
  const maxBaseLength = MAX_SLUG_LENGTH - (SUFFIX_LENGTH + 1);
  const trimmedBase = base.slice(0, maxBaseLength) || 'card';

  return `${trimmedBase}-${suffix}`;
}

/**
 * Resolves the slug for a new card.
 * - A client-provided slug must be unique (else SL02); it is never modified.
 * - An omitted slug is generated from the title and given a random suffix when
 *   it is too short or already taken.
 *
 * @param {Object} data
 * @returns {Promise<String>}
 */
async function resolveSlug(data) {
  let resolved;

  if (data.slug !== undefined) {
    const existing = await CreatorCard.findOne({ query: { slug: data.slug } });

    if (existing) {
      throwBusinessError('SL02', CreatorCardMessages.SLUG_TAKEN);
    }

    resolved = data.slug;
  } else {
    const base = generateSlug(data.title);
    let candidate = base.length < 5 ? buildSuffixedSlug(base) : base;

    /* eslint-disable no-await-in-loop */
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const existing = await CreatorCard.findOne({ query: { slug: candidate } });

      if (!existing) {
        resolved = candidate;
        break;
      }

      candidate = buildSuffixedSlug(base);
    }
    /* eslint-enable no-await-in-loop */

    if (resolved === undefined) {
      resolved = candidate;
    }
  }

  return resolved;
}

/**
 * Creates a Creator Card after validating fields and business rules.
 *
 * @param {Object} serviceData
 * @param {Object} [options]
 * @returns {Promise<Object>} serialized card (creation format, includes access_code)
 */
async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedCreateCardSpec);
  let response;

  try {
    validateCardFields(data);

    const accessType = data.access_type || 'public';

    if (accessType === 'private' && !data.access_code) {
      throwBusinessError('AC01', CreatorCardMessages.ACCESS_CODE_REQUIRED);
    }

    if (accessType !== 'private' && data.access_code !== undefined) {
      throwBusinessError('AC05', CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED);
    }

    const slug = await resolveSlug(data);

    const createdCard = await CreatorCard.create({
      title: data.title,
      description: data.description,
      slug,
      creator_reference: data.creator_reference,
      links: data.links || [],
      service_rates: data.service_rates || null,
      status: data.status,
      access_type: accessType,
      access_code: accessType === 'private' ? data.access_code : null,
    });

    response = serializeCard(createdCard, { includeAccessCode: true });
  } catch (error) {
    appLogger.errorX(error, 'create-creator-card-error');
    throw error;
  }

  return response;
}

module.exports = createCreatorCard;
