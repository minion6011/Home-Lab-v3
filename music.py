import uuid
import time
import yt_dlp

CLIENT_COMBOS = [
    "tv,web_safari",
    "android",
    "ios",
    "web",
]


def generateData(plId: str | int, fileName: str, info: dict) -> tuple:
    duration = int(info.get("duration") or 0)
    minutes, sec = divmod(duration, 60)
    duration_str = f"{minutes}:{sec:02d}"
    data = (
        plId,
        info.get("title"),
        info.get("uploader") or info.get("channel"),
        info.get("thumbnail"),
        time.strftime("%d/%m/%Y", time.localtime()),
        duration_str,
        f"/website/music/{fileName}.mp3",
    )
    return data


def downloadSong(query: str, plId: str | int) -> list[tuple]:
    if query.startswith("https://youtu.be/"):
        query = query.replace("https://youtu.be/", "https://youtube.com/watch?v=")

    is_url = query.startswith("https://")
    target = query if is_url else f"ytsearch1:{query}"

    fileName = uuid.uuid4().hex
    out_template = f"./website/music/{fileName}.%(ext)s"

    last_error = None
    for combo in CLIENT_COMBOS:
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
            "extractor_args": {"youtube": {"player_client": [combo]}},
            "retries": 5,
            "socket_timeout": 10,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(target, download=True)
                if info is None:
                    continue
                if "entries" in info:
                    entries = [e for e in info["entries"] if e]
                    if not entries:
                        continue
                    info = entries[0]
                return [generateData(plId, fileName, info)]
        except Exception as e:
            last_error = e
            print(f"\n---\nclient={combo} {e}")

    raise Exception(f"Failed to download asset with all available clients: {last_error}")