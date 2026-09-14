import time
import threading
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import pypresence

CLIENT_ID = "app_id"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rpc_server")

app = Flask(__name__)
CORS(app)

rpc = pypresence.Presence(CLIENT_ID)
is_connected = False

lock = threading.Lock()
task_reset = None
generation = 0


def cancelRPC(expected_generation: int):
    global is_connected
    with lock:
        if generation != expected_generation:
            return
        try:
            rpc.clear()
        except Exception as e:
            logger.warning(f"Errore durante il clear RPC: {e}")
        finally:
            is_connected = False


def setRPC(title: str, artist: str, img: str, duration: float) -> bool:
    global task_reset, is_connected, generation

    with lock:
        try:
            if not is_connected:
                rpc.connect()
                is_connected = True

            rpc.update(
                activity_type=pypresence.ActivityType.LISTENING,
                details=title,
                state=artist,
                large_image=img,
                start=time.time(),
                end=time.time() + duration,
            )

            generation += 1
            my_generation = generation

            if task_reset:
                task_reset.cancel()

            task_reset = threading.Timer(duration, cancelRPC, args=(my_generation,))
            task_reset.daemon = True
            task_reset.start()
            return True

        except Exception as e:
            logger.error(f"Errore RPC: {e}")
            is_connected = False
            return False


@app.route("/rpc", methods=["POST"])
def handle_rpc():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Missing or invalid JSON body"
        }), 400

    required = ["title", "artist", "img", "duration"]
    if not all(k in data for k in required):
        return jsonify({
            "error": "Missing info"
        }), 400

    try:
        duration = float(data["duration"])
    except (TypeError, ValueError):
        return jsonify({
            "error": "Invalid duration"
        }), 400

    success = setRPC(data["title"], data["artist"], data["img"], duration)

    if success:
        return jsonify({
            "message": "Server ON, Discord ON"
        }), 200
    else:
        return jsonify({
            "error": "Server ON, Discord OFF"
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8765)