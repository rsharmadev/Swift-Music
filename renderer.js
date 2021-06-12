const { ipcRenderer } = require('electron');
const electron = require('electron');
const ipc = electron.ipcRenderer;
const { dialog, BrowserWindow, Menu, app } = require("electron").remote;
const fetch = require('node-fetch');
const fs = require('fs');
const open = require('open');
const path = require("path");


let sound = new Howl({
    src: ['sound.mp3'],
    html5: true
});

let userDataPath = app.getPath('userData');
let playlistPath = path.join(userDataPath, '/playlist.json');
let songsPath = path.join(userDataPath, '/songs');
let thumbnailPath = path.join(userDataPath, '/thumbnails');

let playlist = JSON.parse(fs.readFileSync(playlistPath));

const youtube_id = document.getElementById('youtube_id');
const songsDiv = document.getElementById('songsDiv'); 
const home = document.getElementById('home');
const playingName = document.getElementById('playing');
const playingImg = document.getElementById('playingImg');
const playingBar = document.getElementById('playingBar');
const playBtn = document.getElementById('play');
const backBtn = document.getElementById('back');
const skipBtn = document.getElementById('skip');
const timestamp = document.getElementById('timestamp');
const volumeBar = document.getElementById('volumeBar');
const time = document.getElementById('time');

let length;


function update(firstrun = false) {
    volumeBar.value = playlist['general']['songPlaying']['volume'];
    if(playlist['general']['songPlaying']['id'] == null || playlist['general']['songPlaying']['id'] == 'id') {
        console.log('what');
        for(const [key, value] of Object.entries(playlist['songs'])) {
            playlist['general']['songPlaying'] = {
                id: value['id'],
                unix: key,
                name: value['name'],
                timestamp: '0',
                playPause: 'paused',
            }
            break;
    
        }
        
    } else {
        
        playingName.innerHTML = playlist['general']['songPlaying']['name'];
        playingImg.src = `${thumbnailPath}\\${playlist['general']['songPlaying']['id']}.jpg`;
        console.log('here');
        console.log((parseInt(playlist['general']['songPlaying']['timestamp']) / parseInt(playlist['general']['songPlaying']['length'])) * 100)
        playingBar.value = (parseInt(playlist['general']['songPlaying']['timestamp']) / parseInt(playlist['general']['songPlaying']['length'])) * 100;
        timestamp.innerHTML = playlist['general']['songPlaying']['timestamp'];
        time.innerHTML = playlist['general']['songPlaying']['length']
        if(playlist['general']['songPlaying']['playPause'] == 'paused' || firstrun == true) {
            sound = new Howl({
                src: [`${songsPath}\\${playlist['general']['songPlaying']['id']}.mp3`],
                html5: true,
                volume: parseInt(playlist['general']['songPlaying']['volume'])/100
            });
        }
    }
}

update(firstrun = true);
while(songsDiv.firstChild) {
    songsDiv.removeChild(songsDiv.lastChild);
}
playlist["general"]["songPlaying"]["playPause"] = "paused";
fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

youtube_id.addEventListener('input', () => {
    while(songsDiv.firstChild) {
        songsDiv.removeChild(songsDiv.lastChild);
    }
    console.log('changed');
    ipcRenderer.send('youtube_id', youtube_id.value);
});

function songTemplate(id, name, length) {
    let div = document.createElement('div');
    let img = document.createElement('img');
    let p = document.createElement('p');
    let h1 = document.createElement('h1');
    img.src = `${thumbnailPath}\\${id}.jpg`
    img.className = "w-20 h-20";
    p.className = "text-offwhite ml-8 specwidth truncate text-2xl";
    p.innerHTML = name;
    h1.className = "text-high-yellow text-md ml-auto pr-3";
    h1.innerHTML = length;
    div.className = "w-full bg-darkgray rounded-md px-5 py-4 flex flex-row items-center hovback mb-4";
    div.id = id;
    div.appendChild(img);
    div.appendChild(p);
    div.appendChild(h1);
    songsDiv.appendChild(div);
    return div;
}





ipc.on('youtube_id', (event, data) => {
    console.log(data);
    let songDiv = songTemplate(data['id'], data['name'], String(data['length']));
    songDiv.addEventListener('click', () => {
        ipcRenderer.send('download_song', data['id']);
    });
});

home.addEventListener('click', () => {
    console.log('clicked');
})

playBtn.addEventListener('click', async() => {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    console.log(`${songsPath}/${playlist['general']['songPlaying']['id']}.mp3`);
    
    console.log(playlist['general']['songPlaying']['playPause']);
    if(playlist['general']['songPlaying']['playPause'] == 'paused') {
        playBtn.src = '../images/pause.svg';

        playlist['general']['songPlaying']['playPause'] = 'playing';
        sound.play();
        // ipcRenderer.send('sound', 'play');
    } else if(playlist['general']['songPlaying']['playPause'] == 'playing') {
        playBtn.src = '../images/play.svg';
        playlist['general']['songPlaying']['playPause'] = 'paused';
        console.log('i am here.');
        sound.pause()
        // ipcRenderer.send('sound', 'pause');
    } else {
        console.log('what');
    }

    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    // resume or pause player;
});

backBtn.addEventListener('click', async() => {
    if(playlist['general']['songPlaying']['playPause'] != 'paused') {
        playBtn.click();
    }
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    list_of_unix = [];
    for(const [key, _] of Object.entries(playlist['songs'])) {
        list_of_unix.push(key);
    }
    let newUnixIndex = list_of_unix.indexOf(playlist['general']['songPlaying']['unix']) - 1;
    if(newUnixIndex < 0) {
        newUnixIndex = list_of_unix.length - 1;
    } else if (newUnixIndex > list_of_unix.length - 1) {
        newUnixIndex = 0;
    }
    console.log(newUnixIndex);
    newUnixIndex = (list_of_unix[newUnixIndex]);
    playlist['general']['songPlaying'] = {
        id: playlist['songs'][newUnixIndex]['id'],
        unix: newUnixIndex,
        name: playlist['songs'][newUnixIndex]['name'],
        timestamp: "0",
        length: playlist['songs'][newUnixIndex]['length'],
        playPause: "paused",
        volume: playlist['general']['songPlaying']['volume']
    }
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    update();

});

skipBtn.addEventListener('click', async() => {
    if(playlist['general']['songPlaying']['playPause'] != 'paused') {
        playBtn.click();
    }
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    list_of_unix = [];
    for(const [key, _] of Object.entries(playlist['songs'])) {
        list_of_unix.push(key);
    }
    let newUnixIndex = list_of_unix.indexOf(playlist['general']['songPlaying']['unix']) + 1;
    if(newUnixIndex < 0) {
        newUnixIndex = list_of_unix.length - 1;
    } else if (newUnixIndex > list_of_unix.length - 1) {
        newUnixIndex = 0;
    }
    console.log(newUnixIndex);
    newUnixIndex = (list_of_unix[newUnixIndex]);
    playlist['general']['songPlaying'] = {
        id: playlist['songs'][newUnixIndex]['id'],
        unix: newUnixIndex,
        name: playlist['songs'][newUnixIndex]['name'],
        timestamp: "0",
        length: playlist['songs'][newUnixIndex]['length'],
        playPause: "paused",
        volume: playlist['general']['songPlaying']['volume']
    }
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    update();

});

volumeBar.addEventListener('change', async() => {
    console.log(volumeBar.value)
    playlist['general']['songPlaying']['volume'] = volumeBar.value;
    sound.volume(parseInt(volumeBar.value)/100)
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
});

playingBar.addEventListener('change', async() => {
    var parts = playlist['general']['songPlaying']['length'].split(':');
    var seconds = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    console.log(seconds);
    sound.seek((parseInt(playingBar.value)/100) * seconds);
    timestamp.innerHTML = new Date(((parseInt(playingBar.value)/100) * seconds) * 1000).toISOString().substr(11, 8).substr(3);
});