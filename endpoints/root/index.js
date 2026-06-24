const { createHandler } = require('@app-core/server');

module.exports = createHandler({
  path: '/',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card microservice is running.',
      data: {
        service: 'creator-card-microservice',
        status: 'ok',
        endpoints: {
          create: 'POST /creator-cards',
          retrieve: 'GET /creator-cards/:slug',
          delete: 'DELETE /creator-cards/:slug',
        },
      },
    };
  },
});
