import { asyncHandler } from './helpers';
import { IServices } from '../services/init';

export const routes = (app, services: IServices) => {
  app.get(
    '/relay/height',
    asyncHandler(async (req, res) => {
      const data = await services.relayer.getLastRelayBlock();
      return res.json(data);
    })
  );

  app.get(
    '/relay/info',
    asyncHandler(async (req, res) => {
      const data = await services.relayer.getInfo();
      return res.json(data);
    })
  );

  app.get(
    '/relay/events/info',
    asyncHandler(async (req, res) => {
      const data = await services.relayEvents.getInfo();
      return res.json(data);
    })
  );

  app.get(
    '/relay/events/data',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0 } = req.query;
      const data = await services.relayEvents.getAllEvents({ size, page });
      return res.json(data);
    })
  );

  app.get(
    '/main-events/info',
    asyncHandler(async (req, res) => {
      const data = await services.onebtcEvents.getInfo();
      return res.json(data);
    })
  );

  app.get(
    '/main-events/data',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0 } = req.query;
      const data = await services.onebtcEvents.getAllEvents({ size, page });
      return res.json(data);
    })
  );
};
