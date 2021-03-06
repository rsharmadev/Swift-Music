const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require("path");
const yt = require('youtube-mp3-downloader');
const fetch = require('node-fetch');
const Jimp = require('jimp');
const yts = require('yt-search');
const RPC = require('discord-rpc');
let userDataPath = app.getPath('userData');
let playlistPath = path.join(userDataPath, '/playlist.json');
let songsPath = path.join(userDataPath, '/songs');
let thumbnailPath = path.join(userDataPath, '/thumbnails');
let playlist;
let win;
const timeObj = new Date();

const rpc = new RPC.Client({
    transport: "ipc"
})


function richPresence() {
    rpc.on('ready', () => {
        rpc.setActivity({
            details: "Listening To MUSIC",
            startTimestamp: timeObj,
            largeImageKey: "swift",
            largeImageText: "Swift Music"
        })
        console.log("Ready!");
    })

    rpc.login({
        clientId: "853556280186765332"
    })
}

if ((process.argv).indexOf("--no-rich-presence") == -1) {
    richPresence();
}

let config = new yt({
    "ffmpegPath": "ffmpeg.exe",
    "outputPath": songsPath
});

let search_config = new yt({
    "ffmpegPath": "ffmpeg.exe",
    "outputPath": songsPath
});


let temp_storage = {
    "id": "",
    "name": "",
    "length": ""
}

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1360,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
        frame: false,
        icon: "public\\images\\logo.png"
    })
    win.setResizable(false);
    //win.setMenu(null);

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
    //win.webContents.openDevTools()

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
    fs.writeFile(`${thumbnailPath}\\${id}.jpg`, buffer, async () => {
        await resize(`${thumbnailPath}\\${id}.jpg`, [1024, 1024]);
    })
}

async function saveToJson(id, songName, length) {
    temp_storage["id"] = id;
    temp_storage["name"] = songName;
    temp_storage["length"] = length;
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
    let video = await yts({ videoId: id })
    await getImage(`https://img.youtube.com/vi/${id}/0.jpg`, id);
    saveToJson(id, video.title, video.duration.timestamp);

}


ipcMain.on('download_song', (event, data) => {
    win.webContents.send("show_loading", {
        "": ""
    });
    video_download(data);
})





ipcMain.on('status', (_, data) => {
    try {
        rpc.setActivity({
            details: data,
            startTimestamp: timeObj,
            largeImageKey: "swift",
            largeImageText: "Swift Music"
        });
    }
    catch {}
})




ipcMain.on('download_search_song', (event, data) => {
    win.webContents.send("show_loading", {
        "": ""
    });
    temp_storage["id"] = data;
    video_search_download(data);
})

async function video_search_download(id) {
    search_config.download(id, `${id}.mp3`);
}

config.on("finished", function (error, data) {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    playlist['songs'][String(Date.now())] = {
        id: temp_storage["id"],
        name: temp_storage["name"],
        length: temp_storage["length"]
    }


    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    win.webContents.send("hide_loading", {
        "": ""
    });
});

search_config.on("finished", async function (error, data) {
    getImage(`https://img.youtube.com/vi/${temp_storage["id"]}/0.jpg`, temp_storage["id"]);
    let video = await yts({ videoId: temp_storage["id"] })
    temp_storage["name"] = video.title;
    temp_storage["length"] = video.duration.timestamp;
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    playlist['songs'][String(Date.now())] = {
        id: temp_storage["id"],
        name: temp_storage["name"],
        length: temp_storage["length"]
    }

    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    win.webContents.send("hide_loading", {
        "": ""
    });
});


ipcMain.on('youtube_id', async (event, data) => {
    if (data.includes("?v=")) {
        var v_index = data.indexOf("?v=");
        data = data.substring(v_index + 3);
    }
    await translate_video_id(data);
});

async function searcher(term) {
    try {
        rpc.setActivity({
            details: "Searching for new songs!",
            startTimestamp: timeObj,
            largeImageKey: "swift",
            largeImageText: "Swift Music"
        });
    } catch {}
    let search_term = await yts(term);

    let videos = search_term.videos.slice(0, 3);

    var video_dict = []

    videos.forEach(function (v) {
        video_dict.push({
            "id": v.videoId,
            "name": v.title,
            "length": v.timestamp,
            "thumbnail": v.thumbnail
        });
    });

    win.webContents.send('youtube_search', {
        'stuff': video_dict
    });
}

ipcMain.on('youtube_search', (event, data) => {
    searcher(data);
});

ipcMain.on('quit', (event, data) => {
    app.quit();
});

ipcMain.on('minimize', (event, data) => {
    BrowserWindow.getFocusedWindow().minimize();
});