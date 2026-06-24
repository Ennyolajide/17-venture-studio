/**
 * Maps a persisted Creator Card document to its public API representation.
 *
 * Responsibilities:
 *   - expose the MongoDB `_id` as `id` (never leak `_id`)
 *   - normalise the soft-delete sentinel (`deleted` 0) to `null`
 *   - omit `access_code` entirely for the public retrieval endpoint
 *
 * @param {Object} doc - lean Creator Card document
 * @param {{ includeAccessCode?: boolean, deleted?: number }} [options]
 * @returns {Object}
 */
function serializeCard(doc, options = {}) {
  const { includeAccessCode = false } = options;

  const deletedValue = options.deleted ?? doc.deleted;

  const card = {
    id: doc._id,
    title: doc.title,
    description: typeof doc.description === 'string' ? doc.description : null,
    slug: doc.slug,
    creator_reference: doc.creator_reference,
    links: Array.isArray(doc.links) ? doc.links : [],
    service_rates: doc.service_rates || null,
    status: doc.status,
    access_type: doc.access_type,
  };

  if (includeAccessCode) {
    card.access_code = doc.access_code ?? null;
  }

  card.created = doc.created;
  card.updated = doc.updated;
  card.deleted = deletedValue || null;

  return card;
}

module.exports = serializeCard;
