from __main__ import app, config

from flask import request, render_template, redirect
import time

logged_users = {}
logged_users = {'127.0.0.1': 174690956395}
# {'ip': timestamp}; if timestamp > 60m == Relogin

@app.before_request
def usercheck_before_request():
    if not "login" in request.path and not "error" in request.path:
        if request.remote_addr not in logged_users or logged_users[request.remote_addr] < time.time():
            if not request.method == "POST":
                return render_template("login.html")
            else:
                return {}, 401
    if request.remote_addr in logged_users and logged_users[request.remote_addr] > time.time():
            logged_users[request.remote_addr] = time.time() + config["login_duration_minutes"] * 60
    

@app.route('/login', methods=['POST'])
def login_api():
    if request.is_json and "username" in request.json and "password" in request.json:
        if request.json["username"] == config["username"] and request.json["password"] == config["password"]:
            logged_users[request.remote_addr] = time.time() + config["login_duration_minutes"] * 60
            return {"status": "success"}, 200
        else:
            return {"status": "fail"}, 401
