from flask import Flask, request
from flask_cors import CORS
from pypresence import Presence, ActivityType
import time, threading

CLIENT_ID = "app_id"

connected = False
rpc = Presence(CLIENT_ID)
app = Flask(__name__)
CORS(app)

taskReset = None

def cancelRPC():
    try: rpc.clear()
    except: pass
    
@app.route("/rpc", methods=["POST"])
def set_rpc():
    data = request.json
    if str(rpc.loop).find("running=False") != -1:
        try: rpc.connect()
        except: return {"message": "Server ON, Discord client OFF"}, 200
    rpc.update(
        activity_type = ActivityType.LISTENING,
        details=data["title"],
        state=data['artist'],
        large_image=data['img'],
        start=time.time(),
        end=time.time()+data["duration"]
    )
    global taskReset
    if taskReset:
        taskReset.cancel()

    taskReset = threading.Timer(data["duration"], cancelRPC)
    taskReset.start()
    return {"message": "Server ON, Discord client ON"}, 200

app.run(host="127.0.0.1", port=8765)