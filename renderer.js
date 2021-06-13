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
const nextSongsDiv = document.getElementById('nextSongsDiv');
const songs_Lib_Div = document.getElementById('songs_lib_Div');
const home = document.getElementById('home');
const playingName = document.getElementById('playing');
const playingImg = document.getElementById('playingImg');
const playingBar = document.getElementById('playingBar');
const shuffleBtn = document.getElementById('shuffle');
const playBtn = document.getElementById('play');
const backBtn = document.getElementById('back');
const skipBtn = document.getElementById('skip');
const timestamp = document.getElementById('timestamp');
const volumeBar = document.getElementById('volumeBar');
const volIcon = document.getElementById('volIcon');
const time = document.getElementById('time');
const loop = document.getElementById('loop');
let navsound = document.getElementById("navsound");
let exit_btn = document.getElementById("exit_btn");
let minimize_btn = document.getElementById("minimize_btn");

let length;


/*
function forcePlay(unix) {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    if (playlist['general']['songPlaying']['playPause'] != 'paused') {
        playBtn.click();
    }
    playlist['general']['songPlaying'] = {
        id: playlist['songs'][unix]['id'],
        unix: unix,
        name: playlist['songs'][unix]['name'],
        timestamp: "0",
        length: playlist['songs'][unix]['length'],
        playPause: "paused",
        volume: playlist['general']['songPlaying']['volume']
    }
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    update()
    sound.play();
}
*/

function nextSongTemplate(id, name, length, unix, thumbnail = null) {
    let div = document.createElement('div');
    let img = document.createElement('img');
    let p = document.createElement('p');
    let h1 = document.createElement('h1');
    if (thumbnail != null) {
        img.src = thumbnail;
    } else {
        img.src = `${thumbnailPath}\\${id}.jpg`
    }
    img.className = "w-14 h-14";
    p.className = "text-offwhite ml-4 truncate text-lg w-32";
    p.innerHTML = name;
    h1.className = "text-high-yellow text-md ml-auto pl-5 pr-3";
    h1.innerHTML = length;
    div.className = "w-full bg-bggray rounded-md px-5 py-4 flex flex-row items-center mb-4";
    div.id = id;
    div.setAttribute('unix', unix);
    div.addEventListener('click', async() => {
        let playingCorrect = false;
        while(!playingCorrect) {
            skipBtn.click();
            if(playlist['general']['songPlaying']['unix'] == unix) {
                playingCorrect = true;
                playBtn.click();
            }
        }
    });
    div.appendChild(img);
    div.appendChild(p);
    div.appendChild(h1);
    nextSongsDiv.appendChild(div);
    return div;
}

function update_next_songs() {
    while (nextSongsDiv.firstChild) {
        nextSongsDiv.removeChild(nextSongsDiv.lastChild);
    }
    unix_thing = playlist["general"]["songPlaying"]["unix"];

    list_of_unix = [];
    for (const [key, _] of Object.entries(playlist['songs'])) {
        list_of_unix.push(key);
    }
    console.log(list_of_unix);

    let newUnixIndex = list_of_unix.indexOf(unix_thing);
    console.log(newUnixIndex);
    list_of_unix = list_of_unix.slice(newUnixIndex + 1);
    console.log(list_of_unix);

    /*
    for (var x = 0; x < list_of_unix.length; x++) {
        nextSongTemplate(playlist["songs"][list_of_unix[x]]["id"], playlist["songs"][list_of_unix[x]]["name"], playlist["songs"][list_of_unix[x]]["length"]);
    }
    */
    for(var i of list_of_unix) {
        nextSongTemplate(playlist['songs'][i]['id'], playlist['songs'][i]['name'], playlist['songs'][i]['length'], i)
    }
}



function update(firstrun = false) {
    volumeBar.value = playlist['general']['songPlaying']['volume'];
    if (playlist['general']['songPlaying']['id'] == null || playlist['general']['songPlaying']['id'] == 'id') {
        console.log('what');
        for (const [key, value] of Object.entries(playlist['songs'])) {
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
        if (playlist['general']['songPlaying']['playPause'] == 'paused' || firstrun == true) {
            sound = new Howl({
                src: [`${songsPath}\\${playlist['general']['songPlaying']['id']}.mp3`],
                html5: true,
                volume: parseInt(playlist['general']['songPlaying']['volume']) / 100
            });
            if(sound.loop()) {
                loop.src = "../images/repeatyellow.svg";
            } else {
                loop.src = "../images/repeat.svg";
            }
        }
        update_next_songs();
    }
}




function updater() {
    //console.log('seeking');
    let time = sound.seek();
    // console.log('seeked');
    var parts = playlist['general']['songPlaying']['length'].split(':');
    var seconds = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    // console.log(seconds);
    // sound.seek((parseInt(playingBar.value)/100) * seconds);
    playingBar.value = (time / seconds) * 100;
    timestamp.innerHTML = new Date(((parseInt(playingBar.value) / 100) * seconds) * 1000).toISOString().substr(11, 8).substr(3);


}



let interval = setInterval(updater, 600);
document.getElementById("refresh_img").style.display = "none";


function updateSongs() {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    list_of_songs = [playlist['general']['songPlaying']['id']]
    for(const [key, value] of Object.entries(playlist['songs'])) {
        list_of_songs.push(value['id']);
    }
    fs.readdirSync(songsPath).forEach(name => {
        console.log(name)
        if(!list_of_songs.includes(name.replace('.mp3', ''))) {
            fs.unlinkSync(`${songsPath}\\${name}`);
        }
    });
    fs.readdirSync(thumbnailPath).forEach(name => {
        if(!list_of_songs.includes(name.replace('.jpg', ''))) {
            fs.unlinkSync(`${thumbnailPath}\\${name}`);
        }
    });
}



update(firstrun = true);
playlist["general"]["songPlaying"]["playPause"] = "paused";
fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

youtube_id.addEventListener('input', () => {
    if (youtube_id.value != "") {
        while (songsDiv.firstChild) {
            songsDiv.removeChild(songsDiv.lastChild);
        }
        console.log('changed');
        ipcRenderer.send('youtube_id', youtube_id.value);
    }
});

youtube_search.addEventListener('input', () => {
    if (youtube_search.value != "") {
        while (songsDiv.firstChild) {
            songsDiv.removeChild(songsDiv.lastChild);
        }
        console.log('search');
        ipcRenderer.send('youtube_search', youtube_search.value);
    }
});

exit_btn.addEventListener('click', () => {
    ipcRenderer.send('quit', "");
});

minimize_btn.addEventListener('click', () => {
    ipcRenderer.send('minimize', "");
});

function songTemplate(id, name, length, thumbnail = null) {
    let div = document.createElement('div');
    let img = document.createElement('img');
    let p = document.createElement('p');
    let h1 = document.createElement('h1');
    if (thumbnail != null) {
        img.src = thumbnail;
    } else {
        img.src = `${thumbnailPath}\\${id}.jpg`
    }
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

function songLibTemplate(id, name, length, unix) {
    let div = document.createElement('div');
    let img = document.createElement('img');
    let h1 = document.createElement('h1');
    let del_img = document.createElement('img');
    let p = document.createElement('p');
    let other_div = document.createElement('div');

    img.src = `${thumbnailPath}\\${id}.jpg`;
    img.className = "w-20 h-20";
    p.className = "text-offwhite ml-8 specwidth truncate text-2xl";
    p.innerHTML = name;
    p.id = id;
    h1.className = "text-high-yellow text-md ml-auto pr-3";
    h1.innerHTML = length;
    h1.id = id;
    del_img.className = "w-7 mr-2 touch";
    del_img.src = "../images/delete.svg";
    del_img.id = id + "_delete";
    other_div.className = "h-16 w-0.5 bg-white opacity-10 mx-6";
    div.className = "w-full bg-darkgray rounded-md px-5 py-4 flex flex-row items-center hovback mb-4";
    div.id = id;
    div.setAttribute('unix', unix)

    div.appendChild(img);
    div.appendChild(p);
    div.appendChild(h1);
    div.appendChild(other_div);
    div.appendChild(del_img);
    del_img.addEventListener('click', () => {
        delSong(unix, id);
    });

    songs_Lib_Div.appendChild(div);
    return div;
}


function delSong(unix, id) {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    console.log(unix);
    let count = 0;
    for(const [key, value] of Object.entries(playlist['songs'])) {
        if(value['id'] == playlist['songs'][unix]['id']) {
            count += 1;

        }
    }
    if(playlist['general']['songPlaying']['unix'] != unix && count==1) {
        fs.unlinkSync(`${thumbnailPath}\\${id}.jpg`);
        fs.unlinkSync(`${songsPath}\\${id}.mp3`);
    }
    delete playlist['songs'][unix];
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    updateSongs();
    navsound.click();
}


/*
var deleteLibVar = function (idx) {
    console.log(idx);
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    var id = idx["target"]["id"]
    var shoulddelete = false;
    if (id.indexOf("_delete") != -1) {
        id = id.substr(0, id.indexOf("_delete"));
        shoulddelete = true;
    }
    for (const [key, value] of Object.entries(playlist['songs'])) {
        if (value["id"] == id) {
            if (shoulddelete) {
                delete playlist["songs"][key];
                if(playlist['general']['songPlaying']['id'] != id) {
                    fs.unlinkSync(`${thumbnailPath}\\${id}.jpg`);
                    fs.unlinkSync(`${songsPath}\\${id}.mp3`);
                }
            } else {
                playlist['general']['songPlaying'] = {
                    id: playlist['songs'][key]['id'],
                    unix: key,
                    name: playlist['songs'][key]['name'],
                    timestamp: "0",
                    length: playlist['songs'][key]['length'],
                    playPause: "paused",
                    volume: playlist['general']['songPlaying']['volume']
                }
            }
        }
    }

    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    console.log(playlist['general']['songPlaying']['playPause']);
    if (!shoulddelete || id == playlist["general"]["songPlaying"]["id"]) {
        sound.stop();
        playBtn.src = '../images/play.svg';
    }
    update();
    navsound.click();
}

*/

navsound.addEventListener('click', () => {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    while (songs_Lib_Div.firstChild) {
        songs_Lib_Div.removeChild(songs_Lib_Div.lastChild);
    }
    for (const [key, value] of Object.entries(playlist['songs'])) {
        songLibTemplate(value["id"], value["name"], value["length"], key);
        var div = document.getElementById(value["id"]);
        // div.addEventListener('click', deleteLibVar.bind(div));
    }
});



ipc.on('youtube_search', (event, data) => {
    while (songsDiv.firstChild) {
        songsDiv.removeChild(songsDiv.lastChild);
    }
    var information = data["stuff"];
    let songDiv1 = songTemplate(information[0].id, information[0].name, information[0].length, thumbnail = information[0].thumbnail);
    let songDiv2 = songTemplate(information[1].id, information[1].name, information[1].length, thumbnail = information[1].thumbnail);
    let songDiv3 = songTemplate(information[2].id, information[2].name, information[2].length, thumbnail = information[2].thumbnail);
    songDiv1.addEventListener('click', () => {
        ipcRenderer.send('download_search_song', information[0].id);
    });
    songDiv2.addEventListener('click', () => {
        ipcRenderer.send('download_search_song', information[1].id);
    });
    songDiv3.addEventListener('click', () => {
        ipcRenderer.send('download_search_song', information[2].id);
    });
});


loop.addEventListener('click', async () => {
    console.log(!sound.loop());
    if (sound.loop()) {
        sound.loop(false);
        loop.src = "../images/repeat.svg";
    } else {
        sound.loop(true);
        loop.src = "../images/repeatyellow.svg";
    }
});

ipc.on("hide_loading", (event, data) => {
    document.getElementById("refresh_img").style.display = "none";
});

ipc.on("show_loading", (event, data) => {
    document.getElementById("refresh_img").style.display = "inline-block";
});



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

playBtn.addEventListener('click', async () => {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    console.log(playlist);
    console.log(`${songsPath}/${playlist['general']['songPlaying']['id']}.mp3`);

    console.log(playlist['general']['songPlaying']['playPause']);
    if (playlist['general']['songPlaying']['playPause'] == 'paused') {
        playBtn.src = '../images/pause.svg';

        playlist['general']['songPlaying']['playPause'] = 'playing';
        sound.play();
        ipcRenderer.send('status', `Listening to ${playlist['general']['songPlaying']['name']}`);
    } else if (playlist['general']['songPlaying']['playPause'] == 'playing') {
        playBtn.src = '../images/play.svg';
        playlist['general']['songPlaying']['playPause'] = 'paused';
        console.log('i am here.');
        sound.pause()
        ipcRenderer.send('status', 'Music Paused');
    } else {
        console.log('what');
    }

    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    // resume or pause player;
});

backBtn.addEventListener('click', async () => {
    if (playlist['general']['songPlaying']['playPause'] != 'paused') {
        playBtn.click();
    }
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    list_of_unix = [];
    for (const [key, _] of Object.entries(playlist['songs'])) {
        list_of_unix.push(key);
    }
    let newUnixIndex = list_of_unix.indexOf(playlist['general']['songPlaying']['unix']) - 1;
    if (newUnixIndex < 0) {
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

skipBtn.addEventListener('click', async () => {
    if (playlist['general']['songPlaying']['playPause'] != 'paused') {
        playBtn.click();
    }
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    list_of_unix = [];
    for (const [key, _] of Object.entries(playlist['songs'])) {
        list_of_unix.push(key);
    }
    let newUnixIndex = list_of_unix.indexOf(playlist['general']['songPlaying']['unix']) + 1;
    if (newUnixIndex < 0) {
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

function shufflelol() {
    console.log('hey')
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    let originalPlaylist = playlist['songs'];
    originalList = [];
    let a = {};
    aList = [];
    let keys = Object.keys(playlist['songs']).sort((a, b) => {
        return Math.random() - 0.5;
    });
    keys.forEach(function(k) {
        a[k] = playlist['songs'][k];
    });
    playlist['songs'] = a;
    for(const [key, value] of Object.entries(originalPlaylist)) {
        originalList.push(key);
    }
    
    for(const [key, value] of Object.entries(a)) {
        aList.push(key);
    }
    
    let sameOrNot = (originalList.every(function(element, index) {
        return element === aList[index];
    }));

    if(sameOrNot) {
        console.log('yea')
        shufflelol();
    }



    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    navsound.click();

}

shuffleBtn.addEventListener('click', shufflelol);




volumeBar.addEventListener('input', async () => {
    if(volumeBar.value == 0) {
        volIcon.src = '../images/volume-x.svg';
    } else if(volumeBar.value <=39) {
        volIcon.src = '../images/volume-1.svg';
    } else {
        volIcon.src = '../images/volume-2.svg'
    }

    console.log(volumeBar.value)
    playlist['general']['songPlaying']['volume'] = volumeBar.value;
    sound.volume(parseInt(volumeBar.value) / 100)
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
});

playingBar.addEventListener('input', async () => {
    var parts = playlist['general']['songPlaying']['length'].split(':');
    var seconds = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    console.log(seconds);
    sound.seek((parseInt(playingBar.value) / 100) * seconds);
    timestamp.innerHTML = new Date(((parseInt(playingBar.value) / 100) * seconds) * 1000).toISOString().substr(11, 8).substr(3);
});