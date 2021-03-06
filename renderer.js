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
let home_warn = document.getElementById("home_warn");
let search_warn = document.getElementById("search_warn");

var PlayingStatus = "paused";


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
    div.className = "w-full bg-bggray rounded-md px-5 py-4 flex flex-row items-center mb-4 hovback2 cursor-pointer";
    div.id = id;
    div.setAttribute('unix', unix);
    div.addEventListener('click', async () => {
        let playingCorrect = false;
        while (!playingCorrect) {
            skipBtn.click();
            if (playlist['general']['songPlaying']['unix'] == unix) {
                playingCorrect = true;
                playBtn.click();
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

    let newUnixIndex = list_of_unix.indexOf(unix_thing);
    list_of_unix = list_of_unix.slice(newUnixIndex + 1);

    /*
    for (var x = 0; x < list_of_unix.length; x++) {
        nextSongTemplate(playlist["songs"][list_of_unix[x]]["id"], playlist["songs"][list_of_unix[x]]["name"], playlist["songs"][list_of_unix[x]]["length"]);
    }
    */
    for (var i of list_of_unix) {
        nextSongTemplate(playlist['songs'][i]['id'], playlist['songs'][i]['name'], playlist['songs'][i]['length'], i)
    }
    if (list_of_unix.length < 1) {
        nextSongTemplate("", "No Songs", "", "", thumbnail = "../images/logo.png");
    }
}



function update(firstrun = false) {
    volumeBar.value = playlist['general']['songPlaying']['volume'];
    if (playlist['general']['songPlaying']['id'] == null || playlist['general']['songPlaying']['id'] == 'id') {
        for (const [key, value] of Object.entries(playlist['songs'])) {
            playlist['general']['songPlaying'] = {
                id: value['id'],
                unix: key,
                name: value['name'],
            }
            break;

        }

    } else {
        playingName.innerHTML = playlist['general']['songPlaying']['name'];
        playingImg.src = `${thumbnailPath}\\${playlist['general']['songPlaying']['id']}.jpg`;
        playingBar.value = 0;
        timestamp.innerHTML = "0:00";
        time.innerHTML = playlist['general']['songPlaying']['length']
        if (PlayingStatus == "paused" || firstrun == true) {
            var oldLoop = sound.loop();
            sound = new Howl({
                src: [`${songsPath}\\${playlist['general']['songPlaying']['id']}.mp3`],
                html5: true,
                volume: parseInt(playlist['general']['songPlaying']['volume']) / 100
            });
            if (oldLoop) {
                sound.loop(true);
                loop.src = "../images/repeatyellow.svg";
            } else {
                sound.loop(false);
                loop.src = "../images/repeat.svg";
            }
        }
        update_next_songs();
    }
}




function updater() {
    let time = sound.seek();
    var parts = playlist['general']['songPlaying']['length'].split(':');
    var seconds = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    playingBar.value = (time / seconds) * 100;
    timestamp.innerHTML = new Date(((parseInt(playingBar.value) / 100) * seconds) * 1000).toISOString().substr(11, 8).substr(3);


}



let interval = setInterval(updater, 600);
document.getElementById("refresh_img").style.display = "none";


function updateSongs() {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    list_of_songs = [playlist['general']['songPlaying']['id']]
    for (const [key, value] of Object.entries(playlist['songs'])) {
        list_of_songs.push(value['id']);
    }
    fs.readdirSync(songsPath).forEach(name => {
        if (!list_of_songs.includes(name.replace('.mp3', ''))) {
            fs.unlinkSync(`${songsPath}\\${name}`);
        }
    });
    fs.readdirSync(thumbnailPath).forEach(name => {
        if (!list_of_songs.includes(name.replace('.jpg', ''))) {
            fs.unlinkSync(`${thumbnailPath}\\${name}`);
        }
    });
}



update(firstrun = true);
fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));

youtube_id.addEventListener('input', () => {
    if (youtube_id.value != "") {
        while (songsDiv.firstChild) {
            songsDiv.removeChild(songsDiv.lastChild);
        }
        ipcRenderer.send('youtube_id', youtube_id.value);
    }
});

youtube_search.addEventListener('input', () => {
    if (youtube_search.value != "") {
        while (songsDiv.firstChild) {
            songsDiv.removeChild(songsDiv.lastChild);
        }
        ipcRenderer.send('youtube_search', youtube_search.value);
    }
});

function swap(arr, firstIndex, secondIndex){
    var temp = arr[firstIndex];
    arr[firstIndex] = arr[secondIndex];
    arr[secondIndex] = temp;
    }

function bubbleSortAlgo(arraaytest){
    var len = arraaytest.length,
    i, j, stop;
    for (i=0; i < len; i++){
        for (j=0, stop=len-i; j < stop; j++){
            if (arraaytest[j] > arraaytest[j+1]){
                swap(arraaytest, j, j+1);
            }
        }
    }
    return arraaytest;
}

function restore_order() {
    list_of_songs = [];
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    for(const [key, value] of Object.entries(playlist['songs'])) {
        list_of_songs.push(key);
    }

    list_of_songs = bubbleSortAlgo(list_of_songs);
    list_of_songs.reverse();

    temp_songs = {}

    for (var i = 0; i < list_of_songs.length; i++) {
        temp_songs[list_of_songs[i]] = {
            id: playlist["songs"][list_of_songs[i]]["id"],
            name: playlist["songs"][list_of_songs[i]]["name"],
            length: playlist["songs"][list_of_songs[i]]["length"]
        }
    }

    playlist["songs"] = temp_songs;
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
}


exit_btn.addEventListener('click', () => {
    restore_order();
    ipcRenderer.send('quit', "");
});

minimize_btn.addEventListener('click', () => {
    ipcRenderer.send('minimize', "");
});

function songTemplate(id, name, length, thumbnail = null) {
    home_warn.innerHTML = "Click on song to save to your playlist!";
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

    img.addEventListener('click', () => {
        playSong(unix, id);
    });
    h1.addEventListener('click', () => {
        playSong(unix, id);
    });
    p.addEventListener('click', () => {
        playSong(unix, id);
    });
    div.addEventListener('click', () => {
        playSong(unix, id);
    });

    songs_Lib_Div.appendChild(div);
    return div;
}

function playSong(unix, id) {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    let count = 0;
    for (const [key, value] of Object.entries(playlist['songs'])) {
        if (value['id'] == playlist['songs'][unix]['id']) {
            count += 1;
        }
    }
    if (playlist['general']['songPlaying']['unix'] != unix && count == 1) {
        playlist['general']['songPlaying'] = {
            id: playlist['songs'][unix]['id'],
            unix: unix,
            name: playlist['songs'][unix]['name'],
            length: playlist['songs'][unix]['length'],
            volume: playlist['general']['songPlaying']['volume']
        }
    }
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    sound.stop();
    PlayingStatus = 'paused';
    playBtn.src = '../images/play.svg'
    /*
    PlayingStatus = 'playing';
    playBtn.src = '../images/pause.svg';
    */
    updateSongs();
    update();
    playBtn.click();
    navsound.click();
}


function delSong(unix, id) {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    let count = 0;
    for (const [key, value] of Object.entries(playlist['songs'])) {
        if (value['id'] == playlist['songs'][unix]['id']) {
            count += 1;

        }
    }
    if (playlist['general']['songPlaying']['unix'] != unix && count == 1) {
        fs.unlinkSync(`${thumbnailPath}\\${id}.jpg`);
        fs.unlinkSync(`${songsPath}\\${id}.mp3`);
    }
    delete playlist['songs'][unix];
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    updateSongs();
    navsound.click();
}

navsound.addEventListener('click', () => {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    while (songs_Lib_Div.firstChild) {
        songs_Lib_Div.removeChild(songs_Lib_Div.lastChild);
    }
    counter = 0;
    for (const [key, value] of Object.entries(playlist['songs'])) {
        counter++;
        songLibTemplate(value["id"], value["name"], value["length"], key);
        var div = document.getElementById(value["id"]);
        // div.addEventListener('click', deleteLibVar.bind(div));
    }
    if (counter == 0) {
        search_warn.innerHTML = "Go to Home to start.";
    } else {
        search_warn.innerHTML = "Click on song to play it!";
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
    restore_order();
    update_next_songs();
});

ipc.on("show_loading", (event, data) => {
    document.getElementById("refresh_img").style.display = "inline-block";
});



ipc.on('youtube_id', (event, data) => {
    let songDiv = songTemplate(data['id'], data['name'], String(data['length']));
    songDiv.addEventListener('click', () => {
        ipcRenderer.send('download_song', data['id']);
    });
});

playBtn.addEventListener('click', async () => {
    playlist = JSON.parse(fs.readFileSync(playlistPath));

    if (PlayingStatus == 'paused') {
        playBtn.src = '../images/pause.svg';

        PlayingStatus = 'playing';
        sound.play();
        ipcRenderer.send('status', `Listening to ${playlist['general']['songPlaying']['name']}`);
    } else if (PlayingStatus == 'playing') {
        playBtn.src = '../images/play.svg';
        PlayingStatus = 'paused';
        sound.pause()
        ipcRenderer.send('status', 'Music Paused');
    } else {
        console.log('what');
    }

    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
});

backBtn.addEventListener('click', async () => {
    if (PlayingStatus != 'paused') {
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
    newUnixIndex = (list_of_unix[newUnixIndex]);
    playlist['general']['songPlaying'] = {
        id: playlist['songs'][newUnixIndex]['id'],
        unix: newUnixIndex,
        name: playlist['songs'][newUnixIndex]['name'],
        length: playlist['songs'][newUnixIndex]['length'],
        volume: playlist['general']['songPlaying']['volume']
    }
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    update();

});

skipBtn.addEventListener('click', async () => {
    if (PlayingStatus != 'paused') {
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
    newUnixIndex = (list_of_unix[newUnixIndex]);
    playlist['general']['songPlaying'] = {
        id: playlist['songs'][newUnixIndex]['id'],
        unix: newUnixIndex,
        name: playlist['songs'][newUnixIndex]['name'],
        length: playlist['songs'][newUnixIndex]['length'],
        volume: playlist['general']['songPlaying']['volume']
    }
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    update();
    playBtn.click();
});

function shufflelol() {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
    let originalPlaylist = playlist['songs'];
    originalList = [];
    let a = {};
    aList = [];
    let keys = Object.keys(playlist['songs']).sort((a, b) => {
        return Math.random() - 0.5;
    });
    keys.forEach(function (k) {
        a[k] = playlist['songs'][k];
    });
    playlist['songs'] = a;
    for (const [key, value] of Object.entries(originalPlaylist)) {
        originalList.push(key);
    }

    for (const [key, value] of Object.entries(a)) {
        aList.push(key);
    }

    let sameOrNot = (originalList.every(function (element, index) {
        return element === aList[index];
    }));

    if (sameOrNot) {
        shufflelol();
    }



    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    navsound.click();

}

shuffleBtn.addEventListener('click', shufflelol);




volumeBar.addEventListener('input', async () => {
    if (volumeBar.value == 0) {
        volIcon.src = '../images/volume-x.svg';
    } else if (volumeBar.value <= 39) {
        volIcon.src = '../images/volume-1.svg';
    } else {
        volIcon.src = '../images/volume-2.svg'
    }

    playlist['general']['songPlaying']['volume'] = volumeBar.value;
    sound.volume(parseInt(volumeBar.value) / 100)
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
});

playingBar.addEventListener('input', async () => {
    var parts = playlist['general']['songPlaying']['length'].split(':');
    var seconds = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    sound.seek((parseInt(playingBar.value) / 100) * seconds);
    timestamp.innerHTML = new Date(((parseInt(playingBar.value) / 100) * seconds) * 1000).toISOString().substr(11, 8).substr(3);
});