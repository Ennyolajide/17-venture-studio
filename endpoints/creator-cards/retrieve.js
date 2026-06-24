const { createHandler } = require('@app-core/server');
const retrieveCreatorCard = require('@app/services/creator-card/retrieve-creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const response = await retrieveCreatorCard({
      ...rc.query,
      slug: rc.params.slug,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Retrieved Successfully.',
      data: response,
    };
  },
});
