import { useEffect, useState } from "react";
import "./output.css";
import { Card, CardBody, Textarea, Tooltip } from "@heroui/react";
import { Delete } from "@mui/icons-material";

enum SynCBoardActions {
  SAVE = "save",
  DELETE = "delete",
}

enum DataStorage {
  SyncBoard = "SyncBoard",
}

type ClipBoardData = {
  copiedValue: string;
  timeStamp: number;
};

const MyComponent = () => {
  const [copyText, setCopyText] = useState<string>("");
  const [clipBoard, setClipBoard] = useState<ClipBoardData[]>([]);

  /** method used for sending message to the background script */
  function sendMessage(action: SynCBoardActions, data: ClipBoardData) {
    chrome.runtime.sendMessage({
      action,
      data: {
        ...data,
      },
    });
  }

  /** method used for adding `entered` value to board and `syncing` it */
  const handleEnteredValue = (copiedText: string) => {
    const value = copiedText.trim();
    const timeStamp = Date.now();

    if (!(value && value.trim().length === 0)) {
      setClipBoard((prev) => [...prev, { copiedValue: value, timeStamp }]);
      setCopyText("");
      sendMessage(SynCBoardActions.SAVE, {
        copiedValue: value,
        timeStamp,
      });
    }
  };

  /** method used for loading `SyncBoard` values */
  const loadSyncBoardValues = () => {
    chrome.storage.sync.get(DataStorage.SyncBoard, (result) => {
      if (result && result[DataStorage.SyncBoard]?.length > 0) {
        setClipBoard(result[DataStorage.SyncBoard]);
      }
    });
  };

  useEffect(() => {
    loadSyncBoardValues();
  }, []);

  // for constantly updating the clipboard
  useEffect(() => {
    const handleOnchange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes[DataStorage.SyncBoard]?.newValue) {
        setClipBoard(changes[DataStorage.SyncBoard].newValue);
      }
    };
    chrome.storage.sync.onChanged.addListener(handleOnchange);
    return () => {
      chrome.storage.sync.onChanged.removeListener(handleOnchange);
    };
  }, []);
  return (
    <>
      <div className="grid h-full grid-cols-12 gap-4 p-2">
        <Textarea
          value={copyText}
          onChange={(e) => {
            setCopyText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleEnteredValue(copyText);
            }
          }}
          isRequired
          className="sticky top-0 left-0 z-20 max-w-xs"
          label=""
          labelPlacement="outside"
          placeholder="Paste your value here..."
        />

        {clipBoard?.length > 0 &&
          clipBoard?.map((item, ind) => {
            return (
              <Tooltip key={ind} content="Click to copy" placement="top">
                <Card
                  key={ind}
                  className="cursor-pointer"
                  style={{ maxHeight: "200px" }}
                >
                  <CardBody>
                    <p
                      className="overflow-hidden"
                      onClick={() =>
                        navigator.clipboard.writeText(item.copiedValue)
                      }
                    >
                      {item.copiedValue}
                    </p>
                    <div className="flex justify-end">
                      <Delete
                        onClick={() => {
                          sendMessage(SynCBoardActions.DELETE, item);
                        }}
                        fontSize="small"
                        sx={{
                          color: "gray",
                          cursor: "pointer",
                          transition: "color 0.2s",
                          "&:hover": {
                            color: "red",
                          },
                        }}
                      />
                    </div>
                  </CardBody>
                </Card>
              </Tooltip>
            );
          })}
      </div>
    </>
  );
};

export default MyComponent;
