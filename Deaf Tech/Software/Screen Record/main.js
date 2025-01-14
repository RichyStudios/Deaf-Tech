
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let webcamWindow;

function createWindows() {
    // Main application window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Floating webcam window
    webcamWindow = new BrowserWindow({
        width: 320,
        height: 240,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    webcamWindow.loadFile('webcam.html');

    // Make webcam window draggable
    webcamWindow.setMovable(true);
}

app.whenReady().then(createWindows);
