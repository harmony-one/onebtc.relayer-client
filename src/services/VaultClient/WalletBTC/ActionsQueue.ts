import {sleep} from "../../../utils";

interface IAction {
  resolve: (res) => void;
  reject: (res) => void;
  func: () => Promise<any>;
}

export class ActionsQueue {
  actionsQueue: IAction[] = [];

  constructor() {
    this.asyncQueue();
  }

  addAction = (action: IAction) => this.actionsQueue.push(action);

  asyncQueue = async () => {
    while (true) {
      const action = this.actionsQueue.shift();

      if (!!action) {
        try {
          const res = await action.func();
          action.resolve(res);
        } catch (e) {
          action.reject(e);
        }

        await sleep(5000);
      } else {
        await sleep(1000);
      }
    }
  };
}
