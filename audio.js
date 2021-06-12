const yt = require('youtube-mp3-downloader');
const fs = require('fs');
const fetch = require('node-fetch');
const Jimp = require('jimp');

let currentLibrary = JSON.parse(fs.readFileSync('library.json'));

let config = new yt({
    "ffmpegPath": "ffmpeg.exe",
    "outputPath": "./songs"
});



video_download('ewBulJdtGlM');



config.on('finished', function(err, data) {
    console.log(data['videoTitle']);
    saveToJson(data['videoId'], data['videoTitle'])
});


async function getImage(url, id) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFile(`./thumbnails/${id}.jpg`, buffer, () => {
        resize(`./thumbnails/${id}.jpg`, [1024, 1024]);
    })
}

function saveToJson(id, name) {
    currentLibrary = JSON.parse(fs.readFileSync('library.json'));
    if(!(id in currentLibrary)) {
        currentLibrary[id] = name;
        fs.writeFileSync('library.json', JSON.stringify(currentLibrary, null, 2))
    }
}

function resize(imagePath, dimensions) {
    Jimp.read(imagePath).then(image => {
        return image.resize(dimensions[0], dimensions[1]).write(imagePath);
    })
}

function video_download(id) {
    config.download(id);
    getImage(`https://img.youtube.com/vi/${id}/0.jpg`, id);
}