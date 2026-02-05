from __main__ import app, config

from music import downloadSong
from flask import render_template, request, session

import psutil, os, json, time

# -- Loads JSON files
def loadMusic():
	with open("website/music.json") as f: data = json.load(f)
	lastkey = -1 # - Sort Playlists
	dataCopy = data.copy()
	for key in data:
		lastkey += 1
		if lastkey != int(key):
			dataCopy[str(lastkey)] = data[key]
			dataCopy[str(lastkey)]["img"] = f"/website/music/{lastkey}.webp"
			if os.path.exists(os.path.join(os.path.dirname(__file__), "website","music", f"{lastkey}.webp")):
				os.remove(os.path.join(os.path.dirname(__file__), "website","music", f"{lastkey}.webp"))
			os.rename(
				os.path.join(os.path.dirname(__file__), "website","music", f"{key}.webp"),
				os.path.join(os.path.dirname(__file__), "website","music", f"{lastkey}.webp")
			)
			del dataCopy[key]
	with open("website/music.json", "w") as f: json.dump(dataCopy, f, indent=4)
	return dataCopy # - Send Sorted Playlists
data_music = loadMusic()
with open("website/accounting.json") as f:
	data_accounting = json.load(f)
with open("website/agenda.json") as f:
	data_agenda = json.load(f)

# - Home
startedTime = time.time()
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

@app.route('/pages/home')
def home():
	return render_template("/pages/home.html", name=config["username"], log_until=session["expires_at"], online_since=startedTime, stats=get_stats())

@app.route('/send_command', methods=['POST'])
def home_terminal():
	if "command" in request.json:
		command = request.json["command"]
		os.system(str(command))
		return {}, 200
	else:
		return "Bad Request", 400

# - Music
@app.route('/pages/music')
def music():
	return render_template("/pages/music.html", data_music=data_music)


@app.route('/playlist', methods=['POST'])
def playlist():
	if request.form: # create or edit
		if request.form["type"] == "edit":
			num = request.form["num"]
			playlist = data_music[request.form["num"]]
		else:
			if len(data_music) != 0: num = str( int( list(data_music.keys())[-1] )+1 )
			else: num = "0"

			data_music[num] = {}
			playlist = data_music[num]
			playlist["songs"] = []
		playlist["name"] = request.form["name"]
		playlist["description"] = request.form["description"].replace("\r","")
		file = request.files.getlist('img')
		if file:
			file[0].save(os.path.join(os.path.dirname(__file__), "website","music", f"{num}.webp"))
		playlist["img"] = f"/website/music/{num}.webp"
		with open("website/music.json", "w") as f:
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
				with open("website/music.json", "w") as f:
					json.dump(data_music, f, indent=4)
				return {}, 200
	return {}, 400


@app.route('/songs', methods=['POST'])
def songs():
	if request.json and "type" in request.json:
		if request.json["type"] == "add" and (request.json["num"] and request.json["num"] in data_music) and request.json["sname"]:
			nwSongs = downloadSong(request.json["sname"])
			iStart = len(data_music[request.json["num"]]["songs"])
			data_music[request.json["num"]]["songs"].extend(nwSongs)
			with open("website/music.json", "w") as f:
				json.dump(data_music, f, indent=4)
			return {"nwSongs": nwSongs, "indexStart": iStart}, 200
		elif request.json["type"] == "get" and (request.json["num"] and request.json["num"] in data_music):
			if request.json["index"] != None and int(request.json["index"]) < len(data_music[request.json["num"]]["songs"]):
				return {"song": data_music[request.json["num"]]["songs"][int(request.json["index"])]}, 200
		elif request.json["type"] == "delete" and (request.json["num"] and request.json["num"] in data_music):
			if request.json["index"] != None and int(request.json["index"]) < len(data_music[request.json["num"]]["songs"]):
				song = data_music[request.json["num"]]["songs"][int(request.json["index"])]
				os.remove(os.path.join(os.path.dirname(__file__), song["url_path"].lstrip("/")))
				data_music[request.json["num"]]["songs"].remove(song)
				with open("website/music.json", "w") as f:
					json.dump(data_music, f, indent=4)
				return {"indexNew":len(data_music[request.json["num"]]["songs"])}, 200
	return {}, 400

# - Accounting
@app.route('/pages/accounting')
def accounting():
	return render_template("/pages/accounting.html", data_accounting=data_accounting)

@app.route('/payments', methods=['POST'])
def payments():
	if request.json and "type" in request.json:
		if request.json["type"] == "add" and all(key in request.json for key in ["profit", "loss", "description"]):
			timeList = time.strftime("%d/%m/%Y", time.localtime())
			adapted_list = [ # struct date(0), profit(1), loss(2), description(3)
				timeList,
				request.json["profit"],
				request.json["loss"],
				request.json["description"]
			]
			data_accounting["losses"] += request.json["loss"]
			data_accounting["profits"] += request.json["profit"]
			data_accounting["table"].insert(0, adapted_list)
			with open("website/accounting.json", "w") as f:
				json.dump(data_accounting, f, indent=4)
			return {"date": timeList}, 200
		elif request.json["type"] == "remove" and "index" in request.json:
			data_accounting["profits"] -= data_accounting["table"][int(request.json["index"])][1]
			data_accounting["losses"] -= data_accounting["table"][int(request.json["index"])][2]
			data_accounting["table"].pop(int(request.json["index"]))
			with open("website/accounting.json", "w") as f:
				json.dump(data_accounting, f, indent=4)
			return {}, 200
		elif request.json["type"] == "reset":
			data_accounting["profits"] = 0
			data_accounting["losses"] = 0
			data_accounting["table"] = []
			with open("website/accounting.json", "w") as f:
				json.dump(data_accounting, f, indent=4)
			return {}, 200
	return {}, 400

# - Agenda
@app.route('/pages/agenda')
def agenda():
	return render_template("/pages/agenda.html", todoList=data_agenda["todo"], agendaList=data_agenda["notes"])

@app.route('/todo', methods=['POST'])
def todo():
	if request.json and "type" in request.json:
		if request.json["type"] == "remove" and "index" in request.json:
			del data_agenda["todo"][int(request.json["index"])]
			with open("website/agenda.json", "w") as f:
				json.dump(data_agenda, f, indent=4)
			return {}, 200
		if request.json["type"] == "switch" and "index" in request.json and "state" in request.json:
			data_agenda["todo"][int(request.json["index"])][1] = request.json["state"]
			with open("website/agenda.json", "w") as f:
				json.dump(data_agenda, f, indent=4)
			return {}, 200
		elif request.json["type"] == "add" and "text" in request.json:
			data_agenda["todo"].insert(0, [request.json["text"], ""])
			with open("website/agenda.json", "w") as f:
				json.dump(data_agenda, f, indent=4)
			return {}, 200
	return {}, 400

@app.route('/note', methods=['POST'])
def note():
	if request.json and "type" in request.json:
		if request.json["type"] == "add" and "text" in request.json:
			data_agenda["notes"].insert(0, request.json["text"])
			with open("website/agenda.json", "w") as f:
				json.dump(data_agenda, f, indent=4)
			return {}, 200
		elif request.json["type"] == "remove" and "index" in request.json:
			del data_agenda["notes"][int(request.json["index"])]
			with open("website/agenda.json", "w") as f:
				json.dump(data_agenda, f, indent=4)
			return {}, 200
	return {}, 400

# - Settings
@app.route('/pages/configs')
def configs():
	with open("website/themes.css") as f:
		themesFile = f.read()
	with open("config.json") as f:
		configFile = f.read()
	return render_template("/pages/configs.html", themesFile=themesFile, configFile=configFile)

@app.route('/load-configs', methods=['POST'])
def loadConfigs():
	if request.json:
		if all(key in request.json for key in ["themesFile", "configFile"]): # struct str(0), str(1)
			with open("website/themes.css", "w") as f:
				f.write(request.json["themesFile"])
			config_data = json.loads(request.json["configFile"])
			with open("config.json", "w") as f:
				json.dump(config_data, f, indent=4)
			config.clear()
			config.update(config_data)
			return {}, 200
	return {}, 400

# - Compression
@app.route('/pages/compression')
def compression():
	return render_template("/pages/compression.html")

@app.route('/compress', methods=['POST'])
def compress_file():
	if request.form and all(key in request.form for key in ["codec", "crf"]):
		file = request.files.getlist('file')
		if file:
			file[0].save(os.path.join(os.path.dirname(__file__), "website", "tempvideo.mp4"))
		command = os.system(f"ffmpeg -y -i website/tempvideo.mp4 -c:v {request.form['codec']} -crf {request.form['crf']} -preset medium website/video.mp4 -loglevel quiet")
		if command == 0:
			os.remove(os.path.join(os.path.dirname(__file__), "website", "tempvideo.mp4"))
			return {}, 200
		else: 
			return {}, 500
	elif request.json and request.json.get("action", None) != None:
		if os.path.exists(os.path.join(os.path.dirname(__file__), "website", "video.mp4")):
			os.remove(os.path.join(os.path.dirname(__file__), "website", "video.mp4"))
			return {}, 200
		return {}, 404
	return {}, 400