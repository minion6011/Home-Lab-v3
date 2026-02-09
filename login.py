from __main__ import app, config

from flask import request, render_template, session, redirect
import time

excludedLogin = ("login", "favicon", "logout") # Paths that will not be checked
ratelimitData = {}
# session["expires_at"] > 60m == Relogin

def get_client_ip():
    if "CF-Connecting-IP" in request.headers:
        return request.headers["CF-Connecting-IP"]
    elif "X-Forwarded-For" in request.headers: 
        return request.headers["X-Forwarded-For"].split(",")[0].strip()
    else: 
        return request.remote_addr

def checkRatelimit(path):
    if path.endswith(".webp"):
        return False
    now = time.time()
    clientIp = get_client_ip()
    # Add new IP
    if not clientIp in ratelimitData or now > ratelimitData[clientIp]["time"]:
        ratelimitData[clientIp] = {"time": round(now) + 60, "requests": 1}
        return False
    # Requests += 
    ratelimitData[clientIp]["requests"] += 1
    # Return Code 429 (if reqs > x)
    if ratelimitData[clientIp]["requests"] > config["requestPerMinute"]:
        return True
    # - CleanUp
    for ip in list(ratelimitData.keys()):
        if now > ratelimitData[ip]["time"]: del ratelimitData[ip]

@app.before_request
def usercheck_before_request():
    if checkRatelimit(request.path): return {"error": "too many request"}, 429
    if all(el not in request.path for el in excludedLogin):
        if not session.get("expires_at") or session["expires_at"] < time.time():
            if not request.method == "POST":
                return render_template("login.html"), 401
            return {}, 401
    if session.get("expires_at") and session["expires_at"] > time.time():
        session["expires_at"] = time.time() + config["login_duration_minutes"] * 60
    

@app.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == "GET": return render_template("login.html"), 401
    if request.is_json and "username" in request.json and "password" in request.json:
        if request.json["username"] == config["username"] and request.json["password"] == config["password"]:
            session["expires_at"] = time.time() + config["login_duration_minutes"] * 60
            return {"status": "success"}, 200
        else:
            return {"status": "fail"}, 401

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/'), 301