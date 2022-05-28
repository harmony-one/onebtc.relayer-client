import { asyncHandler, parseSort, strToBoolean } from './helpers';
import { IServices } from '../services/init';
import { OPERATION_TYPE } from '../services/VaultClient/interfaces';
import { getTxsByAddress } from '../bitcoin/rpc';

export enum MANAGER_ACTION {
  RESET = 'reset',
  CANCEL = 'cancel',
}

export const routes = (app, services: IServices) => {
  app.get(
    '/relay/height',
    asyncHandler(async (req, res) => {
      const data = await services.relayerClient.getLastRelayBlock();
      return res.json(data);
    })
  );

  app.get(
    '/relay/info',
    asyncHandler(async (req, res) => {
      const data = await services.relayerClient.getInfo();
      return res.json(data);
    })
  );

  app.get(
    '/oracle/info',
    asyncHandler(async (req, res) => {
      const data = await services.oracleClient.getInfo();
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
      const data = await services.relayEvents.getAllEvents({
        size,
        page,
        sort: { blockNumber: -1 },
      });
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
      const data = await services.onebtcEvents.getAllEvents({
        size,
        page,
        sort: { blockNumber: -1 },
      });
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

  interface VaultFilters {
    collateral?: { $ne: string };
    lastPing?: { $gte: number };
  }

  app.get(
    '/vaults/data',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0, id, sort, hasCollateral, online } = req.query;

      const sorting = parseSort(sort, { collateral: -1, lastUpdate: -1 });

      const filter: VaultFilters = {};

      if (hasCollateral) {
        filter.collateral = { $ne: '0' };
      }

      if (online) {
        filter.lastPing = { $gte: Date.now() - 1000 * 60 * 5 }; // 5 min
      }

      const data = await services.vaults.getData({ size, page, id, sort: sorting, filter });
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
      const { size = 50, page = 0, requester, vault, id, sort } = req.query;

      const sorting = parseSort(sort, { opentime: -1 });

      const data = await services.issues.getData({
        size,
        page,
        sort: sorting,
        filter: {
          requester,
          vault,
          id,
        },
      });

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
      const { size = 50, page = 0, requester, vault, id, sort } = req.query;

      const sorting = parseSort(sort, { opentime: -1 });

      const data = await services.redeems.getData({
        size,
        page,
        sort: sorting,
        filter: {
          requester,
          vault,
          id,
        },
      });

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

  app.get(
    '/monitor',
    asyncHandler(async (req, res) => {
      let relayerClient = {
        relayContractAddress: process.env.HMY_RELAY_CONTRACT,
        network: process.env.NETWORK,
        btcNodeUrl: process.env.BTC_NODE_URL,
        hmyNodeUrl: process.env.HMY_NODE_URL,
      };

      let relayEvents = {};

      let vaults = {};

      if (services.relayerClient) {
        relayerClient = await services.relayerClient.getInfo();
      }

      if (services.relayEvents) {
        relayEvents = await services.relayEvents.getInfo();
      }

      if (services.vaults) {
        vaults = await services.vaults.getInfo();
      }

      const mainEvents = await services.onebtcEvents.getInfo();
      const issues = await services.issues.getInfo();
      const redeems = await services.redeems.getInfo();

      return res.json({
        relayerClient,
        relayEvents,
        mainEvents,
        issues,
        redeems,
        vaults,
      });
    })
  );

  app.get(
    '/operations/data',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0, requester, vault, id, sort } = req.query;

      const sorting = parseSort(sort, { timestamp: -1 });

      const data = await services.vaultClient.getData({
        size,
        page,
        sort: sorting,
        filter: {
          requester,
          vault,
          id,
        },
      });

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/vault-client/info',
    asyncHandler(async (req, res) => {
      const data = await services.vaultClient.info();

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.post(
    '/vault-client/register',
    asyncHandler(async (req, res) => {
      const data = await services.vaultClient.register(req.body.collateral);

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/vault-client/outputs',
    asyncHandler(async (req, res) => {
      const data = await services.vaultClient.walletBTC.getFreeOutputs(
        req.query.amount || 0,
        !req.query.amount
      );

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.post(
    '/monitor/ping',
    asyncHandler(async (req, res) => {
      await services.vaults.ping(req.body.vault);

      res.send(JSON.stringify({ status: true }, null, 4));
    })
  );

  app.get(
    '/history/:collection',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0, step = 'h' } = req.query;
      const { collection } = req.params;

      const collections = {
        vaults: 'vaults',
        redeemed: 'redeemed_new',
        issued: 'issued_new',
      };

      const data = await services.history.getHistoryData(
        {
          size,
          page,
          sort: { dateTimestamp: -1 },
          collectionName: `history_${collections[collection]}`,
        },
        step
      );

      res.send(data);
    })
  );

  app.get(
    '/security/info',
    asyncHandler(async (req, res) => {
      const data = await services.securityClient.getServiceInfo();

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/security/blocks',
    asyncHandler(async (req, res) => {
      const { size = 50, page = 0, height, hasUnPermittedTxs, id } = req.query;

      const data = await services.securityClient.getData({
        size,
        page,
        sort: { timestamp: -1 },
        filter: {
          height: height && Number(height),
          hasUnPermittedTxs: strToBoolean(hasUnPermittedTxs),
          id,
        },
      });

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/security/txs',
    asyncHandler(async (req, res) => {
      const {
        size = 50,
        page = 0,
        height,
        btcAddress,
        permitted,
        transactionHash,
        vault,
      } = req.query;

      const data = await services.vaultsBlocker.getData({
        size,
        page,
        sort: { timestamp: -1 },
        filter: {
          height: height && Number(height),
          btcAddress,
          permitted: strToBoolean(permitted),
          transactionHash,
          vault,
        },
      });

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.post(
    '/manage/actions/:action',
    asyncHandler(async (req, res) => {
      const { action } = req.params;
      const { secret, ...otherParams } = req.body;

      // await checkAuth(secret, services.database);

      let result;

      switch (action) {
        case MANAGER_ACTION.RESET:
          result = await services.vaultClient.resetOperation(otherParams.operationId);
          break;

        case MANAGER_ACTION.CANCEL:
          result = await services.vaultClient.cancelOperation(otherParams.operationId);
          break;
      }

      return res.json({ result, status: true });
    })
  );

  app.post(
    '/events/add-by-hash',
    asyncHandler(async (req, res) => {
      const data = await services.onebtcEvents.addEventFromTx(req.body.hash);

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/security/validate/:hash',
    asyncHandler(async (req, res) => {
      const data = await services.securityClient.validateTransaction(req.params.hash);

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  // app.get(
  //   '/db/status',
  //   asyncHandler(async (req, res) => {
  //     const stats = await services.database.db.stats();
  //     const status = await services.database.db.admin().serverStatus();

  //     res.header('Content-Type', 'application/json');
  //     res.send(JSON.stringify({ stats, status }, null, 4));
  //   })
  // );

  app.get(
    '/check-txs/status',
    asyncHandler(async (req, res) => {
      const data = await services.wrongPayment.getCheckStatus();

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/check-txs/:vault/latest',
    asyncHandler(async (req, res) => {
      const data = await services.wrongPayment.getLastCheck(req.params.vault);

      data.content.sort((a, b) => (a.type > b.type ? -1 : 1));

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/check-txs/:vault',
    asyncHandler(async (req, res) => {
      const data = await services.wrongPayment.checkIssuesToWrongPayment(req.params.vault);

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/outputs/:vault/balances',
    asyncHandler(async (req, res) => {
      const data = await services.vaultClient.walletBTC.getBalances(req.params.vault);

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/outputs/:vault/total-balance',
    asyncHandler(async (req, res) => {
      const data = await services.vaultClient.walletBTC.getTotalBalance(req.params.vault);

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/outputs/:vault/:amount',
    asyncHandler(async (req, res) => {
      const data = await services.vaultClient.walletBTC.getOutputsByAmount(
        req.params.amount,
        req.params.vault
      );

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.get(
    '/getTxsByAddress/:tx',
    asyncHandler(async (req, res) => {
      const data = await getTxsByAddress(req.params.tx);

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(data, null, 4));
    })
  );

  app.post(
    '/check-txs/return',
    asyncHandler(async (req, res) => {
      const { tx, btcAddress } = req.body;

      const wrongPayTx = await services.wrongPayment.find(tx);

      if (!wrongPayTx) {
        throw new Error('Transaction not found');
      }

      const info = await services.vaultClient.info();

      const operation = await services.vaultClient.createOperation({
        id: tx,
        type: OPERATION_TYPE.RETURN_WRONG_PAY,
        btcAddress,
        amount: wrongPayTx.amount,
        vault: info.vaultAddress,
        requester: info.vaultAddress,
      });

      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(operation, null, 4));
    })
  );
};
