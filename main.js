const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require("path");
const yt = require('youtube-mp3-downloader');
const fetch = require('node-fetch');
const Jimp = require('jimp');


let config = new yt({
    "ffmpegPath": "ffmpeg.exe",
    "outputPath": "../songs"
});

let userDataPath = app.getPath('userData');
let playlistPath = path.join(userDataPath, '/playlist.json');
let playlist;
// console.log(userDataPath);
let win;



function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1650,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    })

    try {
        playlist = JSON.parse(fs.readFileSync(playlistPath));
        console.log('Have found playlist!')
    } catch {
        fs.writeFileSync(playlistPath, JSON.stringify(
            {
                "general": {
                    "songPlaying": {
                        "id": "id",
                        "unix": "unix",
                        "name": "name",
                        "timestamp": "timestamp",
                        "length": "length",
                        "playPause": "playPause",
                        "volume": "0.50"
                    },
                    "otherInfo": {}
                },
                "songs": {
                    "unix": {
                        "id": "id",
                        "name": "name",
                        "length": "length"
                    }
                }
            }
        ));
        console.log('NEW Playlist');
    }
    



    // Load the index.html of the app.
    win.loadFile(path.resolve(__dirname, 'public/build/index.html'))
  
    // Open the DevTools.
    win.webContents.openDevTools()

}
  
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// This method is equivalent to 'app.on('ready', function())'
app.whenReady().then(createWindow)
  
// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their 
    // menu bar to stay active until the user quits 
    // explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});


config.on('finished', function(err, data) {
    console.log(data['videoTitle']);
    saveToJson(data['videoId'], data['videoTitle'], Math.round(((data['stats']['transferredBytes']/1000000) + Number.EPSILON) * 100)/100)
});


async function getImage(url, id) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFile(`../thumbnails/${id}.jpg`, buffer, async() => {
        await resize(`../thumbnails/${id}.jpg`, [1024, 1024]);
    })
}

async function saveToJson(id, songName, length) {
    console.log(length);
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    /*
    playlist['songs'][String(Date.now())] = {
        id: id,
        name: songName,
        length: length
    }
    */
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    win.webContents.send('youtube_id', {
        id: id,
        name: songName,
        length: length
    });
}
async function resize(imagePath, dimensions) {
    Jimp.read(imagePath).then(image => {
        return image.resize(dimensions[0], dimensions[1]).write(imagePath);
    })
}

async function video_download(id) {
    config.download(id, `${id}.mp3`);
    await getImage(`https://img.youtube.com/vi/${id}/0.jpg`, id);
}


ipcMain.on('youtube_id', (event, data) => {
    video_download(data);
})

