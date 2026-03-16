from flask import Flask, request
from flask_cors import CORS
import time, threading, pypresence

CLIENT_ID = "app_id"

app = Flask(__name__)
CORS(app)
rpc = pypresence.Presence(CLIENT_ID)
is_connected = False

lock = threading.Lock()
task_reset = None

def cancelRPC():
    global is_connected
    try:
        with lock: # Wait for the lock to "open"
            rpc.clear()
    except Exception:
        is_connected = False

def setRPC(title: str, artist: str, img: str, duration: float):
    global task_reset, is_connected
    try:
        with lock: # Wait for the lock to "open"
            if not is_connected:
                rpc.connect()
                is_connected = True
            
            rpc.update(
                activity_type=pypresence.ActivityType.LISTENING,
                details=title,
                state=artist,
                large_image=img,
                start=time.time(),
                end=time.time() + duration
            )

            if task_reset:
                task_reset.cancel()
            
            task_reset = threading.Timer(duration, cancelRPC)
            task_reset.start()
            return True
    except Exception as e:
        print(f"Errore RPC: {e}")
        is_connected = False
        return False

@app.route("/rpc", methods=["POST"])
def handle_rpc():
    data = request.json
    
    required = ["title", "artist", "img", "duration"]
    if not all(k in data for k in required):
        return {"error": "Missing info"}, 400

    success = setRPC(data["title"], data['artist'], data['img'], float(data["duration"]))
    
    if success:
        return {"message": "Server ON, Discord ON"}, 200
    else:
        return {"error": "Server ON, Discord OFF"}, 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8765)