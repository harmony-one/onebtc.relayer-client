import { asyncHandler } from './helpers';
import { IServices } from '../services/init';

export const routes = (app, services: IServices) => {
  app.get(
    '/height',
    asyncHandler(async (req, res) => {
      const data = await services.relayer.getLastRelayBlock();

      return res.json(data);
    })
  );

  app.get(
    '/info',
    asyncHandler(async (req, res) => {
      const data = await services.relayer.getInfo();

      return res.json(data);
    })
  );
};
