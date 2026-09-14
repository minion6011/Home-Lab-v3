from __main__ import app
from flask import render_template, send_file, jsonify, request
from login import get_client_ip
import time, uuid, os

# {id: {"ip": str, "audio": {"songdata": tuple | None, "timestamp": float}}}
listeningData = {}

def updateData(ip: str, song: tuple | None) -> str:
    print(listeningData)
    for entry_id, entry in listeningData.items():
        if entry["ip"] == ip:
            entry["audio"] = {"songdata": song, "timestamp": time.time()}
            return entry_id
    new_id = uuid.uuid4().hex
    listeningData[new_id] = {
        "ip": ip,
        "audio": {
            "songdata": song,
            "timestamp": time.time()
        }
    }
    return new_id

def getData(entry_id: str) -> dict | None:
    entry = listeningData.get(entry_id)
    if entry:
        return entry["audio"]
    else:
        return None

@app.route('/listening/<id>')
def listening_id(id):
    return render_template("pages/listening.html", listeningId=id)


@app.route('/listening/<id>/stream')
def listening_stream(id):
    audio = getData(id)
    if not audio:
        return jsonify({}), 400
    if not audio["songdata"][5]:
        return jsonify({}), 404
    
    path = os.path.join(os.path.dirname(__file__), audio["songdata"][5].lstrip("/"))

    if not os.path.exists(path):
        return jsonify({}), 404

    return send_file(path, mimetype="audio/mpeg", conditional=True)

@app.route('/listening/<id>/data')
def listening_data(id):
    audio = getData(id)
    if audio == None or audio["songdata"] == None:
        return jsonify({}), 404
    
    min, sec = map(int, audio["songdata"][4].split(":"))
    sec_tot = (min * 60) + sec

    if (float(audio["timestamp"]) + sec_tot) < time.time():
        return jsonify({}), 410

    return jsonify(audio), 200
    
@app.route('/listening', methods=["POST"])
def listening():
    if not request.json:
        return jsonify({}), 400
    updateData(get_client_ip(), request.json["songData"])
    return jsonify({}), 200