from __main__ import app, config

from flask import request, render_template, session
import time

excludedLogin = ("login", "favicon", "logout") # Paths that will not be checked
# session["expires_at"] > 60m == Relogin

@app.before_request
def usercheck_before_request():
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

@app.route('/logout', methods=['POST', 'GET'])
def logout():
    session.clear()