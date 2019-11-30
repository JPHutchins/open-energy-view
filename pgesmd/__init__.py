import os
from datetime import datetime
from flask import Flask, render_template, request
from itertools import cycle
import pandas as pd
import sqlite3
import json

from pgesmd.helpers import Crosses
from pgesmd.database import EnergyHistory

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

    # initialize the database for json requests
    db = EnergyHistory(path='/test/data/energy_history_test.db')
    db.save_json()

    # a simple page that says hello
    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    @app.route('/data/json', methods=['GET'])
    def get_json():
        json_string = json.dumps(db.json)
        return json_string

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
        dates = []
        i = 0
        for value, start in cur.fetchall():
            # JS needs epoch in ms; the offset is to position the bar correctly
            start = start * 1000 + 1800000
            data.append({'x': start, 'y': value})
            dates.append(start)
            lookup[start] = i
            i += 1

        return render_template('date-chart-new.html',
                               data=data,
                               lookup=lookup,
                               dates=dates)

    @app.route("/test-partitions-chart")
    def partitions_chart():
        part_1_color = '#0000A0'
        part_2_color = '#add8e6'
        part_3_color = '#800080'

        colors_tuple = (part_1_color,
                        part_2_color,
                        part_3_color)

        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')

        cur = conn.cursor()

        cur.execute("""
            SELECT
            max_watt_hour,
            first_entry,
            last_entry,
            n_parts
            FROM info
            WHERE id=0;
            """)

        (max_watt_hour,
         first_entry,
         last_entry,
         n_parts) = cur.fetchone()

        db_info = {
            'max_watt_hour': max_watt_hour,
            'first_entry': first_entry,
            'last_entry': last_entry,
            'n_parts': n_parts
        }

        cur.execute("""
                    SELECT watt_hours, start, part_type
                    FROM espi
                    ORDER BY start ASC;
                    """)
        
        hourly_data = []
        hourly_lookup = {}
        hourly_dates = []
        i = 0
        for value, start, part_type in cur.fetchall():
            # JS needs epoch in ms; the offset is to position the bar correctly
            start = start * 1000 + 1800000
            hourly_data.append({
                'x': start,
                'y': value,
                'color': colors_tuple[part_type]})
            hourly_dates.append(start)
            hourly_lookup[start] = i
            i += 1

        
        data = []
        lookup = {}
        dates = []
        part_info = []

        cur.execute("""
            SELECT
            start,
            start_iso_8601,
            end,
            end_iso_8601,
            middle,
            middle_iso_8601,
            date,
            part_type,
            part_name,
            part_desc,
            part_color,
            part_avg,
            part_sum
            FROM partitions_b;
            """)

        # Behold, an unfortunately lengthy indented for block
        i = 0
        for (   start,
                start_iso_8601,
                end,
                end_iso_8601,
                middle,
                middle_iso_8601,
                date,
                part_type,
                part_name,
                part_desc,
                part_color,
                part_avg,
                part_sum) in cur.fetchall():

            # JS needs epoch in ms; the offset is given by using the middle
            bar_center = middle * 1000

            # This list of objects can be passed direclty to Chart.js
            data.append({
                'x': bar_center,
                'y': part_avg})

            # This list is used for a binary search lookup of index
            dates.append(bar_center)

            # This list of objects contains the complete part_info from the DB
            part_info.append({
                'start': start,
                'start_iso_8601': start_iso_8601,
                'end': end,
                'end_iso_8601': end_iso_8601,
                'middle': middle,
                'middle_iso_8601': middle_iso_8601,
                'date': date,
                'part_type': part_type,
                'part_name': part_name,
                'part_desc': part_desc,
                'part_color': colors_tuple[part_type],
                'part_avg': part_avg,
                'part_sum': part_sum})

            # This object allows for reverse lookup if start is known
            lookup[bar_center] = i
            i += 1

        # End of the long for block
        
        return render_template('date-chart-parts.html',
                               db_info=db_info,
                               part_info=part_info,
                               data=data,
                               lookup=lookup,
                               dates=dates,
                               hourly_data=hourly_data,
                               hourly_dates=hourly_dates,
                               hourly_lookup=hourly_lookup)


    @app.route("/test-partitions-chart-old", methods=['GET'])
    def partitions_chart_old():
        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')

        cur = conn.cursor()

        cur.execute("SELECT n_parts FROM info WHERE id=0;")
        n_parts = cur.fetchone()[0]

        part_names = []
        part_times = []
        for i in range(1, n_parts + 1):
            cur.execute(f"""
                        SELECT part_{i}_name, part_{i}_time
                        FROM info;
                        """)
            name, time = zip(*cur.fetchall())
            part_names.append(*name)
            part_times.append(*time)

        part_intervals = []
        j = 1
        c = Crosses(part_times[j])
        t = 0
        for time in part_times:
            for i in range(time, time + 24):
                h = i % 24
                if c.test(h):
                    part_intervals.append(t)
                    t = 0
                    j = (j + 1) % n_parts
                    c = Crosses(part_times[j])
                    break
                t += 1

        part_1_color = '#0000A0'
        part_2_color = '#add8e6'
        part_3_color = '#800080'

        colors_tuple = (part_1_color, part_2_color, part_3_color)

        part_value_lists = [None] * 5
        part_date_lists = [None] * 5
        part_start_lists = [None] * 5

        for i in range(0, n_parts):
            cur.execute(f"""
                        SELECT part_{i+1}_avg, date, start
                        FROM partitions
                        WHERE part_{i+1}_avg != 'None';
                        """)
            part_value, part_date, part_start = zip(*cur.fetchall())
            part_value_lists[i] = (list(part_value))
            part_date_lists[i] = (list(part_date))
            part_start_lists[i] = (list(part_start))

        part_values = list(zip(
            part_value_lists[0],
            part_value_lists[1],
            part_value_lists[2]))

        part_dates = list(zip(
            part_date_lists[0],
            part_date_lists[1],
            part_date_lists[2]))
        
        part_starts = list(zip(
            part_start_lists[0],
            part_start_lists[1],
            part_start_lists[2]))

        values = [v for i in part_values for v in i]
        labels = [l for i in part_dates for l in i]
        starts = [s for i in part_starts for s in i]

        colors = []
        color_picker = cycle(colors_tuple)

        intervals = cycle((part_intervals[0] * 1800000,
                           part_intervals[1] * 1800000,
                           part_intervals[2] * 1800000))

        data = []
        lookup = {}
        dates = []
        i = 0
        for value, start in zip(values, starts):
            # JS needs epoch in ms; the offset is to position the bar correctly
            start = start * 1000 + next(intervals)
            dates.append(start)
            
            data.append({'x': start, 'y': value})
            colors.append(next(color_picker))
            lookup[start] = i
            i += 1

        return render_template('date-chart-parts.html',
                               values=values,
                               labels=labels,
                               colors=colors,
                               starts=starts,
                               data=data,
                               lookup=lookup,
                               dates=dates)

    @app.route('/test-espi-list')
    def long_list():
        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')
        conn.row_factory = sqlite3.Row

        cur = conn.cursor()
        cur.execute("select * from hour")

        rows = cur.fetchall()
        return render_template("list.html", rows=rows)

    @app.route('/test-partitions-list')
    def long_partslist():
        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')
        conn.row_factory = sqlite3.Row

        cur = conn.cursor()
        cur.execute("select * from partitions_b")

        rows = cur.fetchall()
        return render_template("list-parts_b.html", rows=rows)
    
    @app.route('/test-info-list')
    def info_list():
        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')
        conn.row_factory = sqlite3.Row

        cur = conn.cursor()
        cur.execute("select * from info")

        rows = cur.fetchall()
        return render_template("list-info.html", rows=rows)

    @app.route('/test-baseline')
    def baseline():
        conn = sqlite3.connect(
            f'{PROJECT_PATH}/test/data/energy_history_test.db')

        cur = conn.cursor()
        cur.execute("SELECT baseline, date FROM daily")

        values, labels = zip(*cur.fetchall())
        labels = [datetime.strptime(l, '%Y-%m-%d').strftime('%b %d %Y') for l in labels]

        cur = conn.cursor()
        cur.execute("SELECT min, date FROM daily")

        values_min, labels_min = zip(*cur.fetchall())

        cur = conn.cursor()
        cur.execute("SELECT date, min FROM daily")

        data = cur.fetchall()

        window = 30

        df = pd.DataFrame(data, columns=['Date', 'Daily Minimum'])
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.set_index('Date')
        
        ra = df.rolling(window=window).mean()
        rs = df.rolling(window=window).std()

        rsra = zip(df['Daily Minimum'], ra['Daily Minimum'], rs['Daily Minimum'], list(df.index))
       
        smooth = []
        for d_min, d_avg, d_std, date in rsra:
            hi = d_avg + (d_std)
            lo = d_avg - (d_std)
            if d_min < lo or d_min > hi:
                smooth.append((date, d_avg))
            else:
                smooth.append((date, d_min))

        df_smooth = pd.DataFrame(smooth, columns=['Date', 'Daily Minimum'])
        df_smooth['Date'] = pd.to_datetime(df_smooth['Date'])
        df_smooth = df_smooth.set_index('Date')

        ra_smooth = df_smooth.rolling(window=window).mean()

        result = ra_smooth['Daily Minimum']

        mean = [x for x in result]
        mean = mean[window-1:]
        
        return render_template('line.html',
                               values=values,
                               labels=labels,
                               value_min=values_min,
                               mean=mean
                               )

    return app
