from __main__ import app, config

from flask import render_template, request
from login import logged_users
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
def playlist(): # da aggiungere un controllo se i dati richiesti nel form e json esistono nella request
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
        playlist["description"] = request.form["description"]
        file = request.files.getlist('img')
        if file:
            file[0].save(f"{os.getcwd()}\\website\\music\\{num}.webp")
        playlist["img"] = f"/website/music/{num}.webp"
        with open("music.json", "w") as f:
            json.dump(data_music, f, indent=4)
        return {"plName": request.form["name"], "plNum": num, "plSrc": f"/website/music/{num}.webp"}, 200
    elif request.json: # get
        if request.json["num"] and request.json["num"] in data_music:
            return data_music[request.json["num"]]