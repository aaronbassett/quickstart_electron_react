const { app, BrowserWindow, ipcMain } = require("electron");
const Realm = require("realm");
const ObjectId = require("bson").ObjectId;

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile("./build/index.html");
}

app.whenReady().then(async () => {
  const realmApp = new Realm.App({ id: "tutsbrawl-qfxxj" }); // Replace <Your App ID> with your application id
  let credentials = Realm.Credentials.anonymous();
  // log in anonymously
  let user = await realmApp.logIn(credentials);

  const PersonSchema = {
    name: "Person",
    properties: {
      _id: "objectId",
      name: "string",
    },
    primaryKey: "_id",
  };

  const config = {
    schema: [PersonSchema],
    path: "myrealm.realm",
    sync: {
      user: user,
      partitionValue: "My Partition",
    },
  };
  // open a synced realm

  const realm = await Realm.open(config);

  // DELETE LATER - JUST FOR DEV PURPOSES:
  realm.write(() => {
    // Delete all objects from the realm.
    realm.deleteAll();
  });

  // Get all Persons in the realm

  const persons = realm.objects("Person");
  // create a new "Person"
  realm.write(() => {
    realm.create("Person", {
      _id: new ObjectId(),
      name: "Robb Stark",
    });
  });
  // when receiving an "asynchronous-message" from the renderer process,
  // upload all local changes to the synced realm

  ipcMain.on("asynchronous-message", (event, arg) => {
    if (arg === "sync") {
      realm.syncSession.uploadAllLocalChanges();

      console.log("main process: Syncing all local changes");
      console.log(
        `main process: Created persons object: \t ${JSON.stringify(
          persons,
          null,
          2
        )}`
      );

      // send a reply to the renderer process with the created person's name

      event.reply(
        "asynchronous-reply",
        `created persons object with the name ${
          persons[persons.length - 1].name
        }`
      );
    }
  });

  createWindow();
});
