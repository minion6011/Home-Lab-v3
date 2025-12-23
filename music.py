from __main__ import config

from pytubefix.cli import on_progress
from pytubefix import YouTube, Playlist, Search

import uuid, time

spotify_check = config["spotify_CL-ID"]+config["spotify-CL-SECRET"] != ""
if spotify_check:
	import spotipy
	from spotipy.oauth2 import SpotifyClientCredentials
	sp = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(client_id=config["spotify_CL-ID"], client_secret=config["spotify-CL-SECRET"]))

	def Spotify_Getsongs(plId): # Playlist Migration
		song_names = []
		results = sp.playlist_items(plId)
		while results: # Si usa il while perchè la richiesta è una paginazione # - fare check se il sito crasha
			for item in results['items']:
				track = item['track']
				if track:
					if "artists" in track: song_names.append( (track['name'], track["artists"][0]["name"]) )
					else: song_names.append( (track['name'], "") )
			if results['next']:
				results = sp.next(results)
			else:
				results = None
		return song_names

def downloadSong(name:str):
	videos = []
	if name.startswith("https://"):
		if name.startswith("https://open.spotify.com/playlist/") and spotify_check:
			try:
				for song, name in Spotify_Getsongs(name.split("/")[-1].split("?")[0]):
					try:
						fileName = uuid.uuid4().hex
						video = Search(f"{song} {name}").videos[0]
						min, sec = divmod(video.length, 60)
						videos.append({
							"name": video.title,
							"artist": video.author,
							"img": video.thumbnail_url,
							"added": time.strftime("%d/%m/%Y", time.localtime()),
							"duration": str(min) + ":" + str(sec).rjust(2, "0"),
							"url_path": f"/website/music/{fileName}.mp3"
						})
						video.streams.get_audio_only().download(output_path="./website/music", filename=fileName+".mp3")
					except Exception as e:
						print(f"[DEBUG] Error, Spotify Playlist Single\n{e}")
			except Exception as e:
				print(f"[DEBUG] Error, Spotify Playlist Loop\n{e}")
		else:
			pl = Playlist(name)
			try:
				for video in pl.videos: # first test
					try:
						fileName = uuid.uuid4().hex
						min, sec = divmod(video.length, 60)
						videos.append({
							"name": video.title,
							"artist": video.author,
							"img": video.thumbnail_url,
							"added": time.strftime("%d/%m/%Y", time.localtime()),
							"duration": str(min) + ":" + str(sec).rjust(2, "0"),
							"url_path": f"/website/music/{fileName}.mp3"
						})
						video.streams.get_audio_only().download(output_path="./website/music", filename=fileName+".mp3")
					except Exception as e:
						print(f"[DEBUG] Error, YT Playlist Single\n{e}")
			except:
				fileName = uuid.uuid4().hex
				if name.startswith("https://youtu.be/"): name = name.replace("https://youtu.be/", "https://youtube.com/watch?v=")
				video = YouTube(name, on_progress_callback = on_progress)
				min, sec = divmod(video.length, 60)
				videos.append({
					"name": video.title,
					"artist": video.author,
					"img": video.thumbnail_url,
					"added": time.strftime("%d/%m/%Y", time.localtime()),
					"duration": str(min) + ":" + str(sec).rjust(2, "0"),
					"url_path": f"/website/music/{fileName}.mp3"
				})
				video.streams.get_audio_only().download(output_path="./website/music", filename=fileName+".mp3")
	else:
		fileName = uuid.uuid4().hex
		video = Search(name).videos[0]
		min, sec = divmod(video.length, 60)
		videos.append({
			"name": video.title,
			"artist": video.author, 
			"img": video.thumbnail_url, 
			"added": time.strftime("%d/%m/%Y", time.localtime()),
			"duration": str(min) + ":" + str(sec).rjust(2, "0"),
			"url_path": f"/website/music/{fileName}.mp3"
		})
		video.streams.get_audio_only().download(output_path="./website/music", filename=fileName+".mp3")
	return videos