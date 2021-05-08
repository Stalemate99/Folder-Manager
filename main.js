
const { BrowserWindow, app, ipcMain, Notification, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const del = require('del');
const { glob } = require('glob');
const chokidar = require('chokidar');

const {basePath} = require('./config');

const isDev = !app.isPackaged;

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      worldSafeExecuteJavaScript: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html');

  win.once('ready-to-show', ()=> {
      win.show();
  });

}

if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  })
}

app.whenReady().then(createWindow)

// Listening to updates in folder
const watcher = chokidar.watch(basePath,{ persistent : true });

watcher.on('ready', () => {
  console.log("Watching for updates in :",basePath);
  }).on('add', filePath => {
    displayFile(null , basePath);
  }).on('unlink', path => {
    displayFile(null , basePath);
  });

ipcMain.on('display-files',(event, filePath) => {
  displayFile(event, filePath);
});

ipcMain.on('open-file', (event, filePath) => {
  console.log("Main :: filepath ::", filePath);
  shell.openExternal('file://' + filePath);
});

ipcMain.on('delete-file', async (event, filePath) => {
  console.log("Main :: filepath ::", filePath);
  await del(filePath);
  displayFile(event,basePath);
});

//-----------------------------------------------------------------------
// UTILITY
//-----------------------------------------------------------------------

//Creating a new folder 
const createFolder = (path) => {
  fs.mkdir(path,(err)=>{
      console.log(err,path);
  });
}

//Check if folder/file exists
const checkExists = (path) => {
  return fs.existsSync(path);
}

// Get all files in folder
const getFiles = async (src, callback) => {
  glob(src + '/**/*', callback);
};

const displayFile = (event,filePath) => {

  getFiles(filePath, (err,fileRes)=>{
    let path = filePath.replaceAll("\\", "/");
    if(err){
        console.log(err,"Error in getting files.");
    } else {
        let files = fileRes.map(file => {
            return file.split(path + '/')[1];
        });
        if(!event) {
          win.webContents.send("updated-dir", files)
        } else {
          event.sender.webContents.send("updated-dir", files);
        }
    }

  });
}