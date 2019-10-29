import os
import time
from flask import Flask, render_template, request
import sqlite3

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=f'{PROJECT_PATH}/data/energy_history.db',
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # a simple page that says hello
    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    @app.route("/", methods=['GET'])
    def chart():
        start = request.args.get('start', default=0)
        end = request.args.get('end', default=9571569200)
        conn = sqlite3.connect(f'{PROJECT_PATH}/data/energy_history.db')

        cur = conn.cursor()
        cur.execute("""
                    SELECT watt_hours, start
                    FROM espi
                    WHERE start BETWEEN ? and ?
                    """, (start, end))

        values, labels = zip(*cur.fetchall())
        values = [v for v in values]
        labels = [time.strftime('%I%p', time.localtime(l)) for l in labels]

        return render_template('chart.html', values=values, labels=labels)

    @app.route('/list')
    def list():
        conn = sqlite3.connect(f'{PROJECT_PATH}/data/energy_history.db')
        conn.row_factory = sqlite3.Row

        cur = conn.cursor()
        cur.execute("select * from espi")

        rows = cur.fetchall()
        return render_template("list.html", rows=rows)

    return app
