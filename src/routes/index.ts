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
    '/issue-logs/info',
    asyncHandler(async (req, res) => {
      const data = await services.issueLogs.getInfo();
      return res.json(data);
    })
  );

  app.get(
    '/issue-logs/data',
    asyncHandler(async (req, res) => {
      const data = await services.issueLogs.getAllEvents({ size: 100, page: 0 });
      return res.json(data);
    })
  );
};
