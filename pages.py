from __main__ import app, config

from flask import render_template, request
from login import logged_users
from music import downloadSong
import psutil, os, json


with open("music.json") as f:
	data_music = json.load(f)

with open("config.json") as f:
	data_config = json.load(f)

# - Home
def get_stats():
	# Percentage Value 16 char; 100/16 = 6,25; salti da 6,25
	ram = psutil.virtual_memory().percent
	cpu = psutil.cpu_percent(interval=0.4, percpu=False)
	ssd = psutil.disk_usage(os.getcwd()).percent
	return [
		("█"*int(ram/6.25)+"░"*(15-int(ram/6.25)))+f" {ram}%",
		("█"*int(cpu/6.25)+"░"*(15-int(cpu/6.25)))+f" {cpu}%",
		("█"*int(ssd/6.25)+"░"*(15-int(ssd/6.25)))+f" {ssd}%"
		]

@app.route('/home', methods=['GET'])
def home():
	return render_template("/pages/home.html", name=config["username"], ip=request.remote_addr, log_until=logged_users[request.remote_addr], stats=get_stats())

@app.route('/send_command', methods=['POST'])
def home_terminal():
	if "command" in request.json:
		command = request.json["command"]
		os.system(str(command))
		return {}, 200
	else:
		return "Bad Request", 400

# - Music
@app.route('/music', methods=['GET'])
def music():
	return render_template("/pages/music.html", data_music=data_music)


@app.route('/playlist', methods=['POST'])
def playlist():
	if request.form: # create or edit
		if request.form["type"] == "edit":
			num = request.form["num"]
			playlist = data_music[request.form["num"]]
		else:
			data_music["number_tot"] = data_music["number_tot"] + 1

			data_music[str(data_music["number_tot"])] = {}
			playlist = data_music[str(data_music["number_tot"])]
			playlist["songs"] = []
			num = str(data_music["number_tot"])
		playlist["name"] = request.form["name"]
		playlist["description"] = request.form["description"].replace("\r","")
		file = request.files.getlist('img')
		if file:
			file[0].save(os.path.join(os.path.dirname(__file__), f"website\\music\\{num}.webp"))
		playlist["img"] = f"/website/music/{num}.webp"
		with open("music.json", "w") as f:
			json.dump(data_music, f, indent=4)
		return {"plName": request.form["name"], "plNum": num, "plSrc": f"/website/music/{num}.webp"}, 200
	elif request.json and "type" in request.json: # get
		if request.json["type"]:
			if request.json["type"] == "get" and request.json["num"] and request.json["num"] in data_music:
				return data_music[request.json["num"]], 200
			elif request.json["type"] == "delete" and (request.json["num"] and request.json["num"] in data_music):
				try:
					for song in data_music[request.json["num"]]["songs"]:
						os.remove(os.path.join(os.path.dirname(__file__), song["url_path"].lstrip("/")))
				except: pass
				del data_music[request.json["num"]]
				data_music["number_tot"] -= 1
				with open("music.json", "w") as f:
					json.dump(data_music, f, indent=4)
				return {}, 200
	return {}, 404


@app.route('/songs', methods=['POST'])
def songs():
	if request.json and "type" in request.json:
		if request.json["type"] == "add" and (request.json["num"] and request.json["num"] in data_music) and request.json["sname"]:
			nwSongs = downloadSong(request.json["sname"])
			data_music[request.json["num"]]["songs"].extend(nwSongs)
			with open("music.json", "w") as f:
				json.dump(data_music, f, indent=4)
			return {"nwSongs": nwSongs}, 200