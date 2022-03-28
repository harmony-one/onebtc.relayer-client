export enum OPERATION_TYPE {
  ISSUE = 'ISSUE',
  REDEEM = 'REDEEM',
  RETURN_WRONG_PAY = 'RETURN_WRONG_PAY',
}

export enum STATUS {
  ERROR = 'error',
  SUCCESS = 'success',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  CANCELED = 'canceled',
}

export enum ACTION_TYPE {
  waitingConfirmations = 'waitingConfirmations',
  transferBTC = 'transferBTC',
  executeRedeem = 'executeRedeem',
  executeIssue = 'executeIssue',

  // return wrong payment
  validateWrongPayment = 'validateWrongPayment',
  returnBTC = 'returnBTC',
}
