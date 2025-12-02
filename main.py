from flask import Flask, render_template, redirect
import json

with open("config.json") as f:
    config = json.load(f)


app = Flask(__name__, static_folder="website", template_folder="website")
# - Flask Modules
import login
import pages

@app.route('/index', methods=['GET'])
def index():
    return render_template("index.html")


# - Error Handlers

@app.errorhandler(404)
def not_found_error(error):
    return redirect('/index'), 301

if __name__ == '__main__':
    app.run(debug=False, use_reloader=True, port=8091, host="0.0.0.0")