import app from '../../src/api/app';

export const onRequest = async (context: any) => {
  return app.fetch(context.request, context.env, context);
};
