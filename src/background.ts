enum DataStorage {
  SyncBoard = "SyncBoard",
}

type ClipBoardData = {
  copiedValue: string;
  timeStamp: number;
};

enum SynCBoardActions {
  SAVE = "save",
  DELETE = "delete",
}

let SyncBoard: Partial<Array<ClipBoardData>> = [];

chrome.runtime.onInstalled.addListener(() => {
  // initialize the syncboard array
  chrome.storage.sync.set({ SyncBoard: SyncBoard ?? [] });
});

// Load the syncboard from local storage or from a sync
chrome.storage.sync.get(DataStorage.SyncBoard, (result) => {
  SyncBoard = result.SyncBoard || [];
});

chrome.runtime.onMessage.addListener(
  (request: { action: SynCBoardActions; data: ClipBoardData }) => {
    switch (request.action) {
      case SynCBoardActions.SAVE: {
        if (SyncBoard.length >= 50) {
          SyncBoard.shift();
        }
        SyncBoard.push(request.data);
        saveCopiedValues();
        break;
      }
      case SynCBoardActions.DELETE: {
        SyncBoard = SyncBoard.filter(
          (key) => !(key?.timeStamp === request.data.timeStamp)
        );
        saveCopiedValues();
        break;
      }
      default: {
        break;
      }
    }
  }
);

/** used for saving the data in extensions `sync` storage */
function saveCopiedValues() {
  chrome.storage.sync.set({ SyncBoard });
}
