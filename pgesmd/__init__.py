import os
import json
from datetime import datetime
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

    @app.route("/test-gui")
    def test_gui():
        return render_template('test-gui.html')

    @app.route("/test-espi-chart", methods=['GET'])
    def chart():
        start = request.args.get('start', default=0)
        end = request.args.get('end', default=9571569200)
        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')

        cur = conn.cursor()
        cur.execute("""
                    SELECT watt_hours, start
                    FROM espi
                    ORDER BY start ASC;
                    """)
        data = []
        lookup = {}
        i = 0
        for values, starts in cur.fetchall():
            # JS needs epoch in ms; the offset is to position the bar correctly
            starts = starts * 1000 + 1800000
            data.append({'x': starts, 'y': values})
            lookup[starts] = i
            i += 1

        data = str(json.dumps(data))
        lookup = str(json.dumps(lookup))

        return render_template('date-chart.html', data=data, lookup=lookup)

    @app.route('/test-espi-list')
    def long_list():
        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')
        conn.row_factory = sqlite3.Row

        cur = conn.cursor()
        cur.execute("select * from espi")

        rows = cur.fetchall()
        return render_template("list.html", rows=rows)

    @app.route('/test-baseline')
    def baseline():
        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')

        cur = conn.cursor()
        cur.execute("SELECT baseline, date FROM daily")

        values, labels = zip(*cur.fetchall())
        labels = [datetime.strptime(l, '%y/%m/%d').strftime('%b %d %Y') for l in labels]

        return render_template('line.html', values=values, labels=labels)

    return app
