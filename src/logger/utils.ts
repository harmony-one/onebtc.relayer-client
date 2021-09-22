import { Request } from 'express';

export const buildReqInfo = (req: Request) => {
  const { body, params, query, method, url } = req;
  return {
    url,
    method,
    body,
    params,
    query,
  };
};

export const getExtendedData = (logMessage: any) => {
  if (!logMessage.extendedData) {
    return null;
  }

  const { req: originReq, ...restData } = logMessage.extendedData;

  if (!originReq) {
    return restData;
  }

  const req = buildReqInfo(originReq);

  return {
    ...restData,
    req,
  };
};
