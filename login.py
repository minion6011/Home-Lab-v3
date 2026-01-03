from __main__ import app, config

from flask import request, render_template, redirect
import time

logged_users = {}
logged_users = {'127.0.0.1': 174690956395}
# {'ip': timestamp}; if timestamp > 60m == Relogin

def get_client_ip():
    if "CF-Connecting-IP" in request.headers:
        return request.headers["CF-Connecting-IP"]
    elif "X-Forwarded-For" in request.headers:
        return request.headers["X-Forwarded-For"].split(",")[0].strip()
    else:
        return request.remote_addr


@app.before_request
def usercheck_before_request():
    if not "login" in request.path and not "error" in request.path:
        if get_client_ip() not in logged_users or logged_users[get_client_ip()] < time.time():
            if not request.method == "POST":
                return render_template("login.html")
            else:
                return {}, 401
    if get_client_ip() in logged_users and logged_users[get_client_ip()] > time.time():
            logged_users[get_client_ip()] = time.time() + config["login_duration_minutes"] * 60
    

@app.route('/login', methods=['POST'])
def login_api():
    if request.is_json and "username" in request.json and "password" in request.json:
        if request.json["username"] == config["username"] and request.json["password"] == config["password"]:
            logged_users[get_client_ip()] = time.time() + config["login_duration_minutes"] * 60
            return {"status": "success"}, 200
        else:
            return {"status": "fail"}, 401
