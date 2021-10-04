export enum OPERATION_TYPE {
  ISSUE = 'ISSUE',
  REDEEM = 'REDEEM',
}

export enum STATUS {
  ERROR = 'error',
  SUCCESS = 'success',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  CANCELED = 'canceled',
}

export enum ACTION_TYPE {
  waitingForPayment = 'waitingForPayment',
  waitingConfirmations = 'waitingConfirmations',
  transferBTC = 'transferBTC',
  executeRedeem = 'executeRedeem',
  executeIssue = 'executeIssue',
}
