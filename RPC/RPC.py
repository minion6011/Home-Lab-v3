from flask import Flask, request
from flask_cors import CORS
import time, threading, pypresence

CLIENT_ID = "app_id"

rpc = pypresence.Presence(CLIENT_ID)
app = Flask(__name__)
CORS(app)

taskReset = None

def cancelRPC():
    try: rpc.clear()
    except: rpc.close()

def setRPC(title: str, artist: str, img: str, duration: float):
    try:
        rpc.update(
            activity_type = pypresence.ActivityType.LISTENING,
            details=title,
            state=artist,
            large_image=img,
            start=time.time(),
            end=time.time()+duration
        )
        global taskReset
        if taskReset:
            taskReset.cancel()

        taskReset = threading.Timer(duration-1, cancelRPC)
        taskReset.start()
        return True
    except Exception as e:
        return False

@app.route("/rpc", methods=["POST"])
def set_rpc():
    data = request.json
    state = setRPC(data["title"], data['artist'], data['img'], data["duration"])
    if not state:
        try:
            rpc.connect()
            state = setRPC(data["title"], data['artist'], data['img'], data["duration"])
        except Exception as e:
            return {"error": f"Error: {str(e)}"}, 500
    return {"message": "Server ON, Discord client ON"}, 200

app.run(host="127.0.0.1", port=8765)