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

  app.get(
    '/vaults/info',
    asyncHandler(async (req, res) => {
      const data = await services.vaults.getInfo();
      return res.json(data);
    })
  );

  app.get(
    '/vaults/data',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0, id } = req.query;
      const data = await services.vaults.getData({ size, page, id });
      return res.json(data);
    })
  );

  app.get(
    '/vaults/data/:id',
    asyncHandler(async (req, res) => {
      const data = await services.vaults.find(req.params.id);
      return res.json(data);
    })
  );

  app.get(
    '/issues/info',
    asyncHandler(async (req, res) => {
      const data = await services.issues.getInfo();
      return res.json(data);
    })
  );

  app.get(
    '/issues/data',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0, id } = req.query;
      const data = await services.issues.getData({ size, page, id });
      return res.json(data);
    })
  );

  app.get(
    '/issues/data/:id',
    asyncHandler(async (req, res) => {
      const data = await services.issues.find(req.params.id);
      return res.json(data);
    })
  );

  app.get(
    '/redeems/info',
    asyncHandler(async (req, res) => {
      const data = await services.redeems.getInfo();
      return res.json(data);
    })
  );

  app.get(
    '/redeems/data',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0, id } = req.query;
      const data = await services.redeems.getData({ size, page, id });
      return res.json(data);
    })
  );

  app.get(
    '/redeems/data/:id',
    asyncHandler(async (req, res) => {
      const data = await services.redeems.find(req.params.id);
      return res.json(data);
    })
  );
};
