const { ipcRenderer } = require('electron');
const electron = require('electron');
const ipc = electron.ipcRenderer;
const { dialog, BrowserWindow, Menu, app } = require("electron").remote;
const fetch = require('node-fetch');
const fs = require('fs');
const open = require('open');
const path = require("path");


let userDataPath = app.getPath('userData');
let playlistPath = path.join(userDataPath, '/playlist.json');

let playlist = JSON.parse(fs.readFileSync(playlistPath));

const youtube_id = document.getElementById('youtube_id');
const songsDiv = document.getElementById('songsDiv'); 
const home = document.getElementById('home');
const playingName = document.getElementById('playing');
const playingImg = document.getElementById('playingImg');
const playingBar = document.getElementById('playingBar');
const playBtn = document.getElementById('play');
const backBtn = document.getElementById('back');
const skipBtn = document.getElementById('skip')

let length;

var sound = new Howl({
    src: ['sound.mp3']
  });
  
sound.play();

function update() {
    if(playlist['general']['songPlaying']['id'] == null || playlist['general']['songPlaying']['id'] == 'id') {
        console.log('what');
        for(const [key, value] of Object.entries(playlist['songs'])) {
            playlist['general']['songPlaying'] = {
                id: value['id'],
                unix: key,
                name: value['name'],
                timestamp: '0',
                playPause: 'pause'
            }
            break;
    
        }
        
    } else {
        playingName.innerHTML = playlist['general']['songPlaying']['name'];
        playingImg.src = `../../../thumbnails/${playlist['general']['songPlaying']['id']}.jpg`;
        console.log('here');
        console.log((parseInt(playlist['general']['songPlaying']['timestamp']) / parseInt(playlist['general']['songPlaying']['length'])) * 100)
        playingBar.value = (parseInt(playlist['general']['songPlaying']['timestamp']) / parseInt(playlist['general']['songPlaying']['length'])) * 100;
    }
}

update();

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
    img.src = `../../../thumbnails/${id}.jpg`
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
    let songDiv = songTemplate(data['id'], data['name'], String(data['length']).replace('.', ':'));
    songDiv.addEventListener('click', () => {
        console.log('clicked');
        playlist = JSON.parse(fs.readFileSync(playlistPath));
        playlist['songs'][String(Date.now())] = {
            id: data['id'],
            name: data['name'],
            length: String(data['length']).replace('.', ':')
        }
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

        
    })
});

home.addEventListener('click', () => {
    console.log('clicked');
})

playBtn.addEventListener('click', async() => {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    console.log(playlist['general']['songPlaying']['playPause']);
    if(playlist['general']['songPlaying']['playPause'] == 'pause') {
        playlist['general']['songPlaying']['playPause'] = 'play';
        ipcRenderer.send('sound', 'play');
    } else if(playlist['general']['songPlaying']['playPause'] == 'play') {
        playlist['general']['songPlaying']['playPause'] = 'pause';
        ipcRenderer.send('sound', 'pause');
    } else {
        console.log('what');
    }

    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    // resume or pause player;
});

backBtn.addEventListener('click', async() => {
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
        length: playlist['general']['songPlaying']['length'],
        playPause: "pause"
    }
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    update();

});

skipBtn.addEventListener('click', async() => {
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
        length: playlist['general']['songPlaying']['length'],
        playPause: "pause"
    }
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    update();

});