from pytubefix.cli import on_progress
from pytubefix import YouTube, Playlist, Search

import uuid, time

CLIENTS = [
	"WEB",
	"WEB_EMBED",
	"WEB_MUSIC",
	"WEB_CREATOR",
	"WEB_SAFARI",
	"ANDROID",
	"ANDROID_MUSIC",
	"ANDROID_CREATOR",
	"ANDROID_VR",
	"ANDROID_PRODUCER",
	"ANDROID_TESTSUITE",
	"IOS",
	"IOS_MUSIC",
	"IOS_CREATOR",
	"MWEB",
	"TV_EMBED",
	"MEDIA_CONNECT",
]


def downloadSong(query: str, plId):
	for client in CLIENTS:
		try:
			videos = []
			videosData = []
			if query.startswith("https://"):
				# Video Url
				if query.startswith("https://youtu.be/"): 
					query = query.replace("https://youtu.be/", "https://youtube.com/watch?v=")
				yt = YouTube(
					url=query,
					client=client,
					on_progress_callback=on_progress
				)
				videos.append(yt)
			else:
				# Video Search
				yt = Search(
					query=query
				).videos[0]
				videos.append(yt)

			for video in videos:
				fileName = uuid.uuid4().hex
				
				video.streams.get_audio_only().download(
					output_path="./website/music",
					filename=fileName+".mp3",
					skip_existing=False, 
					timeout=10, 
					max_retries=5
				)

				min, sec = divmod(video.length, 60)
				videosData.append((
					plId,
					video.title,
					video.author,
					video.thumbnail_url,
					time.strftime("%d/%m/%Y", time.localtime()),
					str(min) + ":" + str(sec).rjust(2, "0"),
					f"/website/music/{fileName}.mp3"
				))
			return videosData
		except Exception as e:
			print(e)
	raise Exception("Failed to download asset with all available clients")
