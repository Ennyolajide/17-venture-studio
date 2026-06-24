const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creatorCards';

/**
 * @typedef {Object} ServiceRate
 * @property {String} name
 * @property {String} description
 * @property {Number} amount
 *
 * @typedef {Object} CreatorCardSchema
 * @property {String} _id - ULID, serialized as `id` in API responses
 * @property {String} title
 * @property {String} description
 * @property {String} slug - Unique public identifier
 * @property {String} creator_reference
 * @property {Object[]} links
 * @property {Object} service_rates
 * @property {String} status - draft | published
 * @property {String} access_type - public | private
 * @property {String} access_code
 * @property {Number} created
 * @property {Number} updated
 * @property {Number} deleted
 */

// Per the template's conventions, models hold only database-level constraints
// (unique / index / default). Field requirements, enums and lengths are
// validated in the services via VSL - never with `required`/`enum` here.
const schemaConfig = {
  _id: { type: SchemaTypes.ULID },
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String, index: true },
  links: { type: SchemaTypes.Mixed, default: [] },
  service_rates: { type: SchemaTypes.Mixed, default: null },
  status: { type: SchemaTypes.String, index: true },
  access_type: { type: SchemaTypes.String },
  access_code: { type: SchemaTypes.String, default: null },
  created: { type: SchemaTypes.Number },
  updated: { type: SchemaTypes.Number },
  deleted: { type: SchemaTypes.Number, default: 0, index: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

/** @type {CreatorCardSchema} */
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
