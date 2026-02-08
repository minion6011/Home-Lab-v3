from __main__ import app, config

from music import downloadSong
from flask import render_template, request, session, g

import psutil, os, json, time, sqlite3

# -- Loads JSON files
with open("website/music.json") as f: 
	data_music = json.load(f)
with open("website/accounting.json") as f:
	data_accounting = json.load(f)
with open("website/agenda.json") as f:
	data_agenda = json.load(f)

DATABASES = {
	"music": "music.sqlite"
}

def get_db(name: str):
	if 'db' not in g:
		g.db = {}

	if name not in g.db:
		g.db[name] = sqlite3.connect(DATABASES[name])
		g.db[name].cursor().execute("PRAGMA foreign_keys = ON") # Enables foreign_keys
	return g.db[name]

@app.teardown_appcontext
def close_db(exception=None):
	dbs = g.pop('db', {})
	for db in dbs.values():
		db.close()

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
	playlists = get_db("music").cursor().execute("SELECT id, name, img FROM playlists").fetchall()
	return render_template("/pages/music.html", playlists=playlists)


@app.route('/playlist', methods=['POST'])
def playlist():
	db = get_db("music")
	dbCursor = db.cursor()
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
	elif request.json and request.json["type"]: # Get
		if request.json["type"] == "get" and request.json["num"]:
			playlist = dbCursor.execute(
				"SELECT name, description, img FROM playlists WHERE id==?",
				(request.json["num"],)
			).fetchone()
			songs = dbCursor.execute(
				"SELECT idSong, name, artist, img, added, duration, urlPath FROM songs WHERE idPlaylist==?",
				(request.json["num"],)
			).fetchall()
			return {"playlist": playlist, "songs": songs}, 200
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
	if request.form and all(key in request.form for key in ["codec", "bitrate", "crf"]):
		file = request.files.getlist('file')
		if file:
			ext = file[0].filename.split(".")[-1]
			file[0].save(os.path.join(os.path.dirname(__file__), "website", "compression", f"input.{ext}"))
		res = os.system(f"ffmpeg -y -i website/compression/input.{ext} -c:v {request.form['codec']} -crf {request.form['crf']} -b:a {request.form['bitrate']} -preset medium website/compression/outuput.{ext} -loglevel quiet")
		if res == 0:
			os.remove(os.path.join(os.path.dirname(__file__), "website", "compression", f"input.{ext}"))
			return {"outfile": f"/website/compression/outuput.{ext}"}, 200
		return {}, 500
	elif request.json and request.json.get("action", None) != None:
		listDir = os.listdir(os.path.join(os.path.dirname(__file__), "website", "compression"))
		finded = False # could be better
		for file in listDir:
			if file.startswith("outuput."):
				os.remove(os.path.join(os.path.dirname(__file__), "website", "compression", file))
				finded = True
		if finded: return {}, 200
		return {}, 404
	return {}, 400