from flask import Flask, render_template, redirect
import json

with open("config.json") as f:
    config = json.load(f)


app = Flask(__name__, static_folder="website", template_folder="website")
app.secret_key = "key"
# - Flask Modules
import login
import pages

@app.route('/')
@app.route('/<page>')
def index(page="home"): # Change "home" with the default page id
    return render_template("index.html", pageLoad=page)


# - Error Handlers

@app.errorhandler(404)
def not_found_error(error):
    return redirect('/'), 301

if __name__ == '__main__':
    app.run(debug=False, use_reloader=True, port=5000, host="0.0.0.0")