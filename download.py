from pytube import YouTube
import requests
from PIL import Image
from datetime import datetime
import json
import sys

library = json.loads(open("library.json").read())


def get_thumbnail(thumbnail_url, filename):
    with open(f"./thumbnails/{filename}", "wb") as handle:
        response = requests.get(thumbnail_url, stream=True)

        for block in response.iter_content(1024):
            if not block:
                break

            handle.write(block)

    resize_image(f"./thumbnails/{filename}")


def resize_image(image_place):
    image = Image.open(image_place)
    resized_image = image.resize((1024, 1024))

    resized_image.save(image_place)


def get_audio_download(video_id):
    yt = YouTube("https://www.youtube.com/watch?v=" + video_id)
    date = datetime.now()
    date_string = date.strftime("%m%d%Y_%H%M%S")
    library["library"].append({
        "Name": yt.title,
        "Location": "songs/" + date_string + ".webm",
        "Thumbnail": "thumbnails/" + date_string + ".jpg",
        "Id": date_string
    })

    get_thumbnail(yt.thumbnail_url, date_string + ".jpg")

    audio = yt.streams.filter(only_audio=True)
    audio = audio[1].itag
    audio = yt.streams.get_by_itag(audio)
    audio.download(output_path="./songs", filename=date_string)
    with open("library.json", "w+") as file:
        file.write(json.dumps(library))

"""
if __name__ == '__main__':
    get_audio_download("t3-fSXGvrW4")
"""

for line in sys.stdin:
    get_audio_download(line.rstrip())
    quit()
