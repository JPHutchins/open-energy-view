"""Classes and methods pertaining to the storage and analysis of ESPI data."""

import sqlite3
import os
import logging
import heapq
import pytz
from datetime import datetime
from bisect import bisect_left

from pgesmd.helpers import parse_espi_data, Crosses

_LOGGER = logging.getLogger(__name__)

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
timezone = pytz.timezone("US/Pacific")


class EnergyHistory():
    """Class to hold PGE SMD SQL statements and simple database commands."""

    def __init__(self,
                 path='/data/energy_history.db',
                 partitions=[
                     (22, "Night"),
                     (6, "Day"),
                     (17, "Evening")]):
        """Open the connection to database and create tables."""
        self.path = path
        self.partitions = partitions
        self.json = {
            "info": {},
            "data": [],
            "hour": [],
            "part": [],
            "day": [],
            "week": [],
            "month": [],
            "year": []
        }

        self.create_info_table = """
            CREATE TABLE IF NOT EXISTS info (
            id INTEGER PRIMARY KEY,
            max_watt_hour INTEGER DEFAULT 0,
            first_entry INTEGER DEFAULT 4102444799,
            last_entry INTEGER DEFAULT 0,
            n_parts INTEGER,
            part_values INTEGER,
            last_update INTEGER);
            """
        self.create_data_table = """
            CREATE TABLE IF NOT EXISTS data (
            start INTEGER PRIMARY KEY,
            duration INTEGER,
            value INTEGER,
            watt_hours INTEGER,
            date TEXT,
            part_type);
            """
        self.create_hour_table = """
            CREATE TABLE IF NOT EXISTS hour (
            start INTEGER PRIMARY KEY,
            duration INTEGER,
            value INTEGER,
            watt_hours INTEGER,
            date TEXT,
            part_type);
            """
        self.create_part_table = """
            CREATE TABLE IF NOT EXISTS part (
            start INTEGER,
            start_iso_8601,
            end INTEGER,
            end_iso_8601,
            middle INTEGER,
            middle_iso_8601,
            date TEXT,
            part_type INTEGER,
            part_avg INTEGER,
            part_sum INTEGER);
            """
        self.create_day_table = """
            CREATE TABLE IF NOT EXISTS day (
            start INTEGER,
            date TEXT PRIMARY KEY,
            baseline INTEGER,
            min INTEGER,
            day_avg,
            day_sum);
            """
        self.create_week_table = """
            CREATE TABLE IF NOT EXISTS week (
            start INTEGER,
            date TEXT PRIMARY KEY,
            week_avg,
            week_sum);
            """
        self.create_month_table = """
            CREATE TABLE IF NOT EXISTS month (
            start INTEGER,
            date TEXT PRIMARY KEY,
            month_avg,
            month_sum);
            """
        self.create_year_table = """
            CREATE TABLE IF NOT EXISTS year (
            start INTEGER,
            date TEXT PRIMARY KEY,
            year_avg,
            year_sum);
            """

        self.insert_hour = """
            INSERT INTO hour (
            start,
            duration,
            value,
            watt_hours,
            date,
            part_type)
            VALUES (?,?,?,?,?,?);
            """
        self.insert_days = """
            INSERT INTO daily (
            date,
            baseline,
            min)
            VALUES (?,?,?);
            """

        try:
            self.conn = sqlite3.connect(
                f'{PROJECT_PATH}{self.path}')
        except Exception as e:
            _LOGGER.error(e)

        try:
            self.cursor = self.conn.cursor()
            self.cursor.execute(self.create_info_table)
            self.cursor.execute(self.create_data_table)
            self.cursor.execute(self.create_hour_table)
            self.cursor.execute(self.create_part_table)
            self.cursor.execute(self.create_day_table)
            self.cursor.execute(self.create_week_table)
            self.cursor.execute(self.create_month_table)
            self.cursor.execute(self.create_year_table)
        except Exception as e:
            _LOGGER.error(e)

        self.cursor.execute("SELECT id FROM info")
        if not self.cursor.fetchone():
            self.cursor.execute("INSERT INTO info (id) VALUES (?);", (0,))

        self.cursor.execute("SELECT first_entry FROM info")
        self.first_entry = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT last_entry FROM info")
        self.last_entry = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT max_watt_hour FROM info")
        self.max_watt_hour = self.cursor.fetchone()[0]

        self.cursor.execute(
            "UPDATE info SET n_parts = ?;", (len(self.partitions),))

        i = 1
        for part in self.partitions:
            self.cursor.execute(
                f"UPDATE info SET part_{i}_time = ?, part_{i}_name = ?;", (
                    part[0], part[1]))
            i += 1

        part_times, names = zip(*self.partitions)
        self.part_intervals = []
        j = 1
        c = Crosses(part_times[j])
        t = 0
        for time in part_times:
            for i in range(time, time + 24):
                h = i % 24
                if c.test(h):
                    self.part_intervals.append(t)
                    t = 0
                    j = (j + 1) % len(self.partitions)
                    c = Crosses(part_times[j])
                    break
                t += 1

        self.part_desc = []
        for i in range(len(part_times)):
            start = part_times[i]
            end = part_times[(i+1) % len(part_times)]

            if start <= 12:
                start = str(start) + "AM"
            else:
                start = str(start - 12) + "PM"

            if end <= 12:
                end = str(end) + "AM"
            else:
                end = str(end - 12) + "PM"

            self.part_desc.append(start + " - " + end)

    def insert_espi_xml(self, xml_file, baseline_points=3):
        """Insert an ESPI XML file into the database.

        The TABLE "espi" is updated with the raw ESPI data as well as a field,
        watt_hours, that has converted the field, value, to Watt hours; and a
        field, date, that is the date corresponding to the reading in YY/MM/DD.

        The TABLE "daily" is updated with a date for each day on which data was
        pulled as well as the field, basline, which is the average of the
        <baseline_points> lowest values read that day.

        The TABLE "info" is updated with information about the ESPI data that
        is in the "espi" table: the oldest date that has data in UTC, the
        newest date that has data in UTC, and the maximum watt_hour value
        recorded.

        The TABLE "partitions" is updated with the average Watt hours used
        during each partition as defined by the user.  Default partitions are
        0, 8, and 16 corresponding to "Night", "Day", and "Evening".  Up to
        five partitions can be defined by the user.

        Requires that no entries include only part of a day.  For example,
        assuming an hourly data interval, no data should be input that does not
        have the complete data for each 24 hour day.

        The ESPI tuple, seen below as the variable "entry" is indexed:
         - 0, int:   start in UTC
         - 1, int:   duration in seconds
         - 2, int:   value
         - 3, int:   Watt hours (value / duration)
         - 4, string:   date (YY/MM/DD)

        See pgesmd.helpers.parse_espi_xml() for more information.
        """
        def calculate_baseline(min_heap, baseline_points=baseline_points):
            return int(round(sum(heapq.nsmallest(
                baseline_points, min_heap)) / baseline_points))

        def get_hours_mins(time):
            t = datetime.fromtimestamp(time)
            return float(t.strftime('%H')) + (float(t.strftime('%M')) / 60)

        prev_date = next(parse_espi_data(xml_file))[4]
        min_heap = []
        part_type = 0
        part_sum = 0
        part_start = next(parse_espi_data(xml_file))[0]
        c = Crosses(self.partitions[1][0])

        day_sum = 0

        for entry in parse_espi_data(xml_file):
            start, duration, value, watt_hours, date = entry
            
            #  Update the info about the data
            if start < self.first_entry:
                self.first_entry = start
            if start > self.last_entry:
                self.last_entry = start
            if watt_hours > self.max_watt_hour:
                self.max_watt_hour = watt_hours

            #  Calculate the daily partitions
            espi_time = get_hours_mins(start)
            if not c.test(espi_time):
                part_sum += watt_hours
                part_date = date
            else:
                part_end = start
                part_end_iso = timezone.localize(
                    datetime.utcfromtimestamp(part_end))
                part_interval = part_end - part_start
                part_avg = part_sum / part_interval * 3600
                part_middle = part_start + (part_interval / 2)
                part_middle_iso = timezone.localize(
                    datetime.utcfromtimestamp(part_middle))
                part_start_iso = timezone.localize(
                    datetime.utcfromtimestamp(part_start))

                #  Insert into the partitions table    
                self.cursor.execute(f"""
                    INSERT INTO part (
                    start,
                    start_iso_8601,
                    end,
                    end_iso_8601,
                    middle,
                    middle_iso_8601,
                    date,
                    part_type,
                    part_avg,
                    part_sum)
                    VALUES (?,?,?,?,?,?,?,?,?,?);
                    """, (
                        part_start,
                        part_start_iso,
                        part_end,
                        part_end_iso,
                        part_middle,
                        part_middle_iso,
                        part_date,
                        part_type,
                        part_avg,
                        part_sum))

                part_type = (part_type + 1) % len(self.partitions)
                c = Crosses(self.partitions[
                    (part_type + 1) % len(self.partitions)]
                    [0])

                part_sum = watt_hours
                part_start = start

            #  Keep track of daily values
            min_heap.append(watt_hours)
            day_sum += watt_hours

            #  Push daily changes
            if not date == prev_date:
                baseline = calculate_baseline(min_heap)
                daily_min = heapq.nsmallest(1, min_heap)[0]
                self.cursor.execute(
                    self.insert_days, (prev_date, baseline, daily_min))
                min_heap = []
                prev_date = date
            
            #  Insert into the ESPI table
            espi_insert = entry + (part_type,)
            self.cursor.execute(self.insert_espi, espi_insert)

        #  Push the data from the last day
        baseline = calculate_baseline(min_heap)
        daily_min = heapq.nsmallest(1, min_heap)[0]
        self.cursor.execute(self.insert_days, (prev_date, baseline, daily_min))

        #  Update the info table
        self.cursor.execute(
            "UPDATE info SET first_entry = ? WHERE id=0;", (self.first_entry,))
        self.cursor.execute(
            "UPDATE info SET last_entry = ? WHERE id=0;", (self.last_entry,))
        self.cursor.execute(
            "UPDATE info SET max_watt_hour = ? WHERE id=0;", (self.max_watt_hour,))

        #  Commit changes to the database
        self.cursor.execute("COMMIT")

    def get_json(self, type='json'):
        """Return the JSON representation of the EnergyHistory DB."""
        cur = self.cursor

        #  Get the table index references
        cur.execute("SELECT start FROM hour ORDER BY start ASC;")
        hour_list = list(zip(*cur.fetchall()))
        cur.execute("SELECT start FROM part ORDER BY start ASC;")
        part_list = list(zip(*cur.fetchall()))
        cur.execute("SELECT start FROM day ORDER BY start ASC;")
        day_list = list(zip(*cur.fetchall()))
        cur.execute("SELECT start FROM week ORDER BY start ASC;")
        week_list = list(zip(*cur.fetchall()))
        cur.execute("SELECT start FROM month ORDER BY start ASC;")
        month_list = list(zip(*cur.fetchall()))
        cur.execute("SELECT start FROM year ORDER BY start ASC;")
        year_list = list(zip(*cur.fetchall()))
        
        #  Get the info TABLE.
        cur.execute("""
            SELECT max_watt_hour, first_entry, last_entry, n_parts,
                part_values, last_update
            FROM info
            WHERE id=0;
            """)

        (max_watt_hour,
         first_entry,
         last_entry,
         n_parts,
         part_values,
         last_update) = cur.fetchone()

        self.json['info'] = {
            'max_watt_hour': max_watt_hour,
            'first_entry': first_entry,
            'last_entry': last_entry,
            'n_parts': n_parts,
            'part_values': part_values,
            'last_update': last_update
        }

#  week -----------------------------------------------------------------------
        #  Get the week TABLE
        cur.execute("""
            SELECT start, week_avg, week_sum
            FROM week
            ORDER BY start ASC;
            """)

        i = 0
        for start, week_avg, week_sum in cur.fetchall():

            # JS needs epoch in ms, offset is to center bar
            start = start * 1000
            bar_center = start + 302400000
            end = start + 604800000  # DST issues?

            i_month = bisect_left(
                [month_obj['lookup'] for month_obj in self.json['month']],
                start)

            # This list of objects can be passed directly to Chart.js
            self.json['part'].append({
                'x': bar_center,
                'y': week_avg,
                
                'sum': week_sum,

                'type': 'week',
                'interval_start': start,
                'interval_end': end,

                'i_hour_start': bisect_left(hour_list, start),
                'i_hour_end': bisect_left(hour_list, end),

                'i_month': i_month,
                'i_year': self.json['month'][i_month]['i_year'],

                'lookup'[start]: i
                })
            i += 1
#  /week  ----------------------------------------------------------------------

#  day  -----------------------------------------------------------------------
        #  Get the day TABLE
        cur.execute("""
            SELECT start, day_avg, day_sum
            FROM day
            ORDER BY start ASC;
            """)

        # Behold, an unfortunately lengthy indented for block
        i = 0
        for start, day_avg, day_sum in cur.fetchall():

            # JS needs epoch in ms, offset is to center bar
            start = start * 1000
            bar_center = start + 43200000
            end = start + 86400000  # DST issues?

            i_week = bisect_left(
                [week_obj['lookup'] for week_obj in self.json['week']],
                start)

            # This list of objects can be passed directly to Chart.js
            self.json['part'].append({
                'x': bar_center,
                'y': day_avg,
                
                'sum': day_sum,

                'type': 'day',
                'interval_start': start,
                'interval_end': end,

                'i_hour_start': bisect_left(hour_list, start),
                'i_hour_end': bisect_left(hour_list, end),

                'i_week': i_week,
                'i_month': self.json['week'][i_week]['i_month'],
                'i_year': self.json['week'][i_week]['i_year'],

                'lookup'[start]: i
                })
            i += 1
#  /day  ----------------------------------------------------------------------

#  part -----------------------------------------------------------------------
        #  Get the part TABLE
        cur.execute("""
            SELECT start, start_iso_8601, end, end_iso_8601, middle,
                middle_iso_8601, date, part_type, part_avg, part_sum
            FROM part;
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
                part_avg,
                part_sum) in cur.fetchall():

            # JS needs epoch in ms; the offset is given by using the middle
            bar_center = middle * 1000
            start = start * 1000
            end = end * 1000

            i_day = bisect_left(
                [day_obj['lookup'] for day_obj in self.json['day']],
                bar_center)

            # This list of objects can be passed direclty to Chart.js
            self.json['part'].append({
                'x': bar_center,
                'y': part_avg,
                
                'sum': part_sum,

                'type': 'part',
                'part': part_type,
                'interval_start': start,
                'interval_end': end,

                'i_hour_start': bisect_left(hour_list, start),
                'i_hour_end': bisect_left(hour_list, end),

                'i_day': i_day,
                'i_week': self.json['day'][i_day]['i_week'],
                'i_month': self.json['day'][i_day]['i_month'],
                'i_year': self.json['day'][i_day]['i_year'],

                'lookup'[start]: i
                })
            i += 1
#  /part ----------------------------------------------------------------------

#  TO DO - data table for raw ESPI/other

#  hour -----------------------------------------------------------------------
        #  Get the hour TABLE.
        cur.execute("""
            SELECT watt_hours, start, part_type
            FROM hour
            ORDER BY start ASC;
            """)
        
        i = 0
        for value, start, part_type in cur.fetchall():
            # JS needs epoch in ms; the offset is to position the bar correctly
            start = start * 1000

            i_part = bisect_left(
                    [part_obj['lookup'] for part_obj in self.json['part']],
                    start)

            i_day = bisect_left(
                [day_obj['lookup'] for day_obj in self.json['day']],
                start)

            self.json['hour'].append({
                'x': start + 1800000,
                'y': value,

                'sum': value,

                'type': 'hour',
                'part': part_type,
                'interval_start': start,
                'interval_end': start + 3600000,

                'i_data_start': 0,
                'i_data_end': 0,

                'i_part': i_part,
                'i_day': i_day,
                'i_week': self.json['day'][i_day]['i_week'],
                'i_month': self.json['day'][i_day]['i_month'],
                'i_year': self.json['day'][i_day]['i_year'],

                'lookup'[start]: i
            })
            i += 1
#  /hour ----------------------------------------------------------------------


