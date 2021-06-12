const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require("path");
const yt = require('youtube-mp3-downloader');
const fetch = require('node-fetch');
const Jimp = require('jimp');
const getMP3Duration = require('get-mp3-duration')
const yts = require('yt-search');




let userDataPath = app.getPath('userData');
let playlistPath = path.join(userDataPath, '/playlist.json');
let songsPath = path.join(userDataPath, '/songs');
let tempPath = path.join(userDataPath, '/temp');
let thumbnailPath = path.join(userDataPath, '/thumbnails');
let playlist;
// console.log(userDataPath);
let win;

let config = new yt({
    "ffmpegPath": "ffmpeg.exe",
    "outputPath": songsPath
});



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
                "songs": {}
            }
        ));
        console.log('NEW Playlist');
    }

    try {
        fs.readdirSync(songsPath);
        console.log('songs found');
    } catch {
        fs.mkdirSync(songsPath);
        console.log('new songs');
    }
    
    try {
        fs.readdirSync(thumbnailPath);
        console.log('thumbnail found');
    } catch {
        fs.mkdirSync(thumbnailPath);
        console.log('new thumbnail');
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

async function getImage(url, id) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFile(`${thumbnailPath}\\${id}.jpg`, buffer, async() => {
        await resize(`${thumbnailPath}\\${id}.jpg`, [1024, 1024]);
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
}

async function translate_video_id(id) {
    let video = await yts( { videoId: id })
    await getImage(`https://img.youtube.com/vi/${id}/0.jpg`, id);
    saveToJson(id, video.title, video.duration.timestamp);

}

ipcMain.on('download_song', (event, data) => {
    video_download(data);
})


ipcMain.on('youtube_id', (event, data) => {
    if (data.includes("?v="))
    {
        var v_index = data.indexOf("?v=");
        data = data.substring(v_index + 3);
    }
    translate_video_id(data);
})

