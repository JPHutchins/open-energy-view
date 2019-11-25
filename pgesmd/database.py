"""Classes and methods pertaining to the storage and analysis of ESPI data."""

import sqlite3
import os
import logging
import pytz
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from bisect import bisect_left

from pgesmd.helpers import parse_espi_data, Crosses
from pgesmd.database_helpers import (
    insert_into_year,
    insert_into_month,
    insert_into_week,
    insert_into_day,
    insert_into_part,
    insert_into_hour
)

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
                last_update INTEGER DEFAULT 0);
            """
        self.create_incomplete_table = """
            CREATE TABLE IF NOT EXISTS incomplete (
                id INTEGER PRIMARY KEY,
                start INTEGER DEFAULT 0,
                date TEXT,

                part_sum INTEGER DEFAULT 0,
                part_type INTEGER DEFAULT 0,
                part_start INTEGER DEFAULT 0,

                day_sum INTEGER DEFAULT 0,
                day_cnt INTEGER DEFAULT 0,
                day_start INTEGER DEFAULT 0,
                day_min INTEGER DEFAULT 0,

                week_sum INTEGER DEFAULT 0,
                week_cnt INTEGER DEFAULT 0,
                week_start INTEGER DEFAULT 0,

                month_sum INTEGER DEFAULT 0,
                month_cnt INTEGER DEFAULT 0,
                month_start INTEGER DEFAULT 0,

                year_sum INTEGER DEFAULT 0,
                year_cnt INTEGER DEFAULT 0,
                year_start INTEGER DEFAULT 0);
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
                middle INTEGER,
                end INTEGER,
                duration INTEGER,
                value INTEGER,
                watt_hours INTEGER,
                date TEXT,
                part_type);
            """
        self.create_part_table = """
            CREATE TABLE IF NOT EXISTS part (
                start INTEGER PRIMARY KEY,
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
                start INTEGER PRIMARY KEY,
                middle INTEGER,
                end INTEGER,
                date TEXT,
                day_avg,
                day_sum,
                min INTEGER);
            """
        self.create_week_table = """
            CREATE TABLE IF NOT EXISTS week (
                start INTEGER PRIMARY KEY,
                middle INTEGER,
                end INTEGER,
                date TEXT,
                week_avg,
                week_sum);
            """
        self.create_month_table = """
            CREATE TABLE IF NOT EXISTS month (
                start INTEGER PRIMARY KEY,
                middle INTEGER,
                end INTEGER,
                date TEXT,
                month_avg,
                month_sum);
            """
        self.create_year_table = """
            CREATE TABLE IF NOT EXISTS year (
                start INTEGER PRIMARY KEY,
                middle INTEGER,
                end INTEGER,
                date TEXT,
                year_avg,
                year_sum);
            """

        try:
            self.conn = sqlite3.connect(
                f'{PROJECT_PATH}{self.path}')
        except Exception as e:
            _LOGGER.error(e)

        try:
            self.cursor = self.conn.cursor()
            self.cursor.execute(self.create_info_table)
            self.cursor.execute(self.create_incomplete_table)
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

        self.is_empty = self.last_entry == 0

        self.cursor.execute(
            "UPDATE info SET n_parts = ?;", (len(self.partitions),))

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

    def is_sequential(self, xml_file):
        """Check if the xml_file is the next sequence of data."""
        self.cursor.execute("SELECT last_entry FROM info WHERE id=0")
        last_entry = self.cursor.fetchone()[0]

        start = next(parse_espi_data(xml_file))[0]

        if start <= last_entry + 3600:
            return True
        return False

    def get_next_start(self):
        """Return the value needed for API 'published-min'."""
        return self.last_entry + 3600
    
    def get_json(self):
        """Return the JSON representation of the database."""
        return self.json

    def insert_espi_xml(self, xml_file, baseline_points=3, overwrite=False):
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
        #  Set timedeltas
        S_ONE_DAY = int(timedelta(days=1).total_seconds())
        S_ONE_WEEK = int(timedelta(weeks=1).total_seconds())
        ONE_MONTH = relativedelta(months=1)

        def get_hours_mins(time):
            t = datetime.fromtimestamp(time)
            return float(t.strftime('%H')) + (float(t.strftime('%M')) / 60)

        if self.is_empty:  # first import, initialize starting values
            first_item = next(parse_espi_data(xml_file))

            prev_start = 0
            prev_date = first_item[4]

            min_heap = []

            day_sum, day_cnt, day_start = 0, 0, prev_start
            part_sum, part_type, part_start = 0, 0, prev_start
            week_sum, week_cnt, week_start = 0, 0, prev_start
            month_sum, month_cnt, month_start = 0, 0, prev_start
            year_sum, year_cnt, year_start = 0, 0, prev_start

        else:  # retrieve the incomplete interval values and initialize
            self.cursor.execute("""
                SELECT 
                    start, date,
                    part_sum, part_type, part_start,
                    day_sum, day_cnt, day_start, day_min,
                    week_sum, week_cnt, week_start,
                    month_sum, month_cnt, month_start,
                    year_sum, year_cnt, year_start FROM info
                JOIN incomplete ON info.last_update = incomplete.id;
                """)
            (start, date,
             part_sum, part_type, part_start,
             day_sum, day_cnt, day_start, day_min,
             week_sum, week_cnt, week_start,
             month_sum, month_cnt, month_start,
             year_sum, year_cnt, year_start) = self.cursor.fetchone()

            prev_start = start
            prev_date = date

            min_heap = [day_min]

            day_sum, day_cnt, day_start = day_sum, day_cnt, day_start
            part_sum, part_type, part_start = part_sum, part_type, part_start
            week_sum, week_cnt, week_start = week_sum, week_cnt, week_start
            month_sum, month_cnt, month_start = month_sum, month_cnt, month_start
            year_sum, year_cnt, year_start = year_sum, year_cnt, year_start

        prev_datetime = datetime.strptime(prev_date, '%Y-%m-%d')
        prev_week = prev_datetime.isocalendar()[1]
        prev_month = prev_datetime.strftime('%m')
        prev_year = prev_datetime.isocalendar()[0]
        cur_datetime = prev_datetime

        c = Crosses(
                self.partitions[(part_type + 1) % len(self.partitions)][0])

        for entry in parse_espi_data(xml_file):
            if entry[0] <= prev_start and overwrite is False:
                continue  # fast forward to data that has not been entered yet
            start, duration, value, watt_hours, date = entry

            cur_datetime = datetime.strptime(date, '%Y-%m-%d')
            cur_week = cur_datetime.isocalendar()[1]
            cur_month = cur_datetime.strftime('%m')
            cur_year = cur_datetime.isocalendar()[0]

            #  Push yearly changes & reinitialize
            if cur_year != prev_year:
                insert_into_year(self, start, year_start, prev_date, year_sum,
                                 year_cnt, S_ONE_WEEK)
                prev_year = cur_year
                year_sum, year_cnt, year_start = 0, 0, start

            #  Push monthly changes & reinitialize
            if cur_month != prev_month:
                insert_into_month(self, start, month_start, prev_date,
                                  month_sum, month_cnt, ONE_MONTH,
                                  cur_datetime)
                prev_month = cur_month
                month_sum, month_cnt, month_start = 0, 0, start

            #  Push weekly changes & reinitialize
            if cur_week != prev_week:
                insert_into_week(self, start, week_start, prev_date, week_sum,
                                 week_cnt, S_ONE_WEEK)
                prev_week = cur_week
                week_sum, week_cnt, week_start = 0, 0, start

            #  Push daily changes & reinitialize
            if date != prev_date:
                insert_into_day(self, start, day_start, prev_date, day_sum,
                                day_cnt, S_ONE_DAY, min_heap)
                prev_date, min_heap = date, []
                day_sum, day_cnt, day_start = 0, 0, start

            #  Push partition changes & reinitialize
            espi_time = get_hours_mins(start)
            if c.test(espi_time):
                insert_into_part(self, start, part_start, prev_date, part_sum,
                                 timezone, part_type)
                part_type = (part_type + 1) % len(self.partitions)
                c = Crosses(self.partitions[
                    (part_type + 1) % len(self.partitions)]
                    [0])
                part_sum, part_start = 0, start

            #  Insert into the hour table
            insert_into_hour(self, start, duration, value, watt_hours, date,
                             part_type)

            #  Update the info table
            if start < self.first_entry:
                self.first_entry = start
            if start > self.last_entry:
                self.last_entry = start
            if watt_hours > self.max_watt_hour:
                self.max_watt_hour = watt_hours

            #  Update the interval sums
            part_sum += watt_hours

            day_sum += watt_hours
            day_cnt += 1

            week_sum += watt_hours
            week_cnt += 1

            month_sum += watt_hours
            month_cnt += 1

            year_sum += watt_hours
            year_cnt += 1

            #  Keep track of daily minimum
            min_heap.append(watt_hours)

        #  Iteration complete - push the data from the last entries
        insert_into_year(self, start, year_start, prev_date, year_sum,
                         year_cnt, S_ONE_WEEK)
        insert_into_month(self, start, month_start, prev_date, month_sum,
                          month_cnt, ONE_MONTH, cur_datetime)
        insert_into_week(self, start, week_start, prev_date, week_sum,
                         week_cnt, S_ONE_WEEK)
        insert_into_day(self, start, day_start, prev_date, day_sum,
                        day_cnt, S_ONE_DAY, min_heap)
        insert_into_part(self, start, part_start, prev_date, part_sum,
                         timezone, part_type)

        #  Update the info table
        self.cursor.execute(
            "UPDATE info SET first_entry = ? WHERE id=0;", (self.first_entry,))
        self.cursor.execute(
            "UPDATE info SET last_entry = ? WHERE id=0;", (self.last_entry,))
        self.cursor.execute(
            "UPDATE info SET max_watt_hour = ? WHERE id=0;",
            (self.max_watt_hour,))
        cur_timestamp = int(datetime.now().timestamp())
        self.cursor.execute(
            "UPDATE info SET last_update = ? WHERE id=0;", (cur_timestamp,))

        #  Insert into the incomplete table
        day_min = min(min_heap)
        self.cursor.execute("""
            INSERT INTO incomplete (
                id,
                start,
                date,

                part_sum,
                part_type,
                part_start,

                day_sum,
                day_cnt,
                day_start,
                day_min,

                week_sum,
                week_cnt,
                week_start,

                month_sum,
                month_cnt,
                month_start,

                year_sum,
                year_cnt,
                year_start)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);""", (
                cur_timestamp,
                start,
                date,

                part_sum,
                part_type,
                part_start,

                day_sum,
                day_cnt,
                day_start,
                day_min,

                week_sum,
                week_cnt,
                week_start,

                month_sum,
                month_cnt,
                month_start,

                year_sum,
                year_cnt,
                year_start))

        #  Commit changes to the database
        self.cursor.execute("COMMIT")

    def write_json(self, type='json'):
        """Return the JSON representation of the EnergyHistory DB."""
        cur = self.cursor

        #  Set timedeltas
        ONE_DAY = timedelta(days=1)
        ONE_WEEK = timedelta(weeks=1)
        ONE_MONTH = relativedelta(months=1)
        ONE_YEAR = relativedelta(years=1)

        #  Set time deltas in milliseconds
        MS_HALF_HOUR = 1800000
        MS_HOUR = 3600000

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

#  year ----------------------------------------------------------------------
        cur.execute("""
            SELECT start, year_avg, year_sum
            FROM year
            ORDER BY start ASC;
            """)

        i = 0
        for start, year_avg, year_sum in cur.fetchall():

            start_time = datetime.fromtimestamp(start)

            # JS needs epoch in ms, offset is to center bar
            start = start * 1000
            bar_center = int((start_time + ONE_YEAR / 2).timestamp()) * 1000
            end = int((start_time + ONE_YEAR).timestamp()) * 1000

            self.json['part'].append({
                'x': bar_center,
                'y': year_avg,
                
                'sum': year_sum,

                'type': 'year',
                'interval_start': start,
                'interval_end': end,

                'i_month_start': bisect_left(month_list, start),
                'i_month_end': bisect_left(month_list, end),
                'i_week_start': bisect_left(week_list, start),
                'i_week_end': bisect_left(week_list, end),
                'i_day_start': bisect_left(day_list, start),
                'i_day_end': bisect_left(day_list, end),
                'i_part_start': bisect_left(part_list, start),
                'i_part_end': bisect_left(part_list, end),
                'i_hour_start': bisect_left(hour_list, start),
                'i_hour_end': bisect_left(hour_list, end),

                'lookup'[start]: i
                })
            i += 1
#  /year ---------------------------------------------------------------------

#  month ----------------------------------------------------------------------
        cur.execute("""
            SELECT start, month_avg, month_sum
            FROM month
            ORDER BY start ASC;
            """)

        i = 0
        for start, month_avg, month_sum in cur.fetchall():

            start_time = datetime.fromtimestamp(start)

            # JS needs epoch in ms, offset is to center bar
            start = start * 1000
            bar_center = int((start_time + ONE_MONTH / 2).timestamp()) * 1000
            end = int((start_time + ONE_MONTH).timestamp()) * 1000

            i_year = bisect_left(
                [year_obj['lookup'] for year_obj in self.json['year']],
                start)

            self.json['part'].append({
                'x': bar_center,
                'y': month_avg,
                
                'sum': month_sum,

                'type': 'month',
                'interval_start': start,
                'interval_end': end,

                'i_week_start': bisect_left(week_list, start),
                'i_week_end': bisect_left(week_list, end),
                'i_day_start': bisect_left(day_list, start),
                'i_day_end': bisect_left(day_list, end),
                'i_part_start': bisect_left(part_list, start),
                'i_part_end': bisect_left(part_list, end),
                'i_hour_start': bisect_left(hour_list, start),
                'i_hour_end': bisect_left(hour_list, end),

                'i_year': i_year,

                'lookup'[start]: i
                })
            i += 1
#  /month ---------------------------------------------------------------------

#  week -----------------------------------------------------------------------
        cur.execute("""
            SELECT start, week_avg, week_sum
            FROM week
            ORDER BY start ASC;
            """)

        i = 0
        for start, week_avg, week_sum in cur.fetchall():

            start_time = datetime.fromtimestamp(start)

            # JS needs epoch in ms, offset is to center bar
            start = start * 1000
            bar_center = int((start_time + ONE_WEEK / 2).timestamp()) * 1000
            end = int((start_time + ONE_WEEK).timestamp()) * 1000

            i_month = bisect_left(
                [month_obj['lookup'] for month_obj in self.json['month']],
                start)

            self.json['part'].append({
                'x': bar_center,
                'y': week_avg,
                
                'sum': week_sum,

                'type': 'week',
                'interval_start': start,
                'interval_end': end,

                'i_day_start': bisect_left(day_list, start),
                'i_day_end': bisect_left(day_list, end),
                'i_part_start': bisect_left(part_list, start),
                'i_part_end': bisect_left(part_list, end),
                'i_hour_start': bisect_left(hour_list, start),
                'i_hour_end': bisect_left(hour_list, end),

                'i_month': i_month,
                'i_year': self.json['month'][i_month]['i_year'],

                'lookup'[start]: i
                })
            i += 1
#  /week ----------------------------------------------------------------------

#  day  -----------------------------------------------------------------------
        cur.execute("""
            SELECT start, day_avg, day_sum
            FROM day
            ORDER BY start ASC;
            """)

        # Behold, an unfortunately lengthy indented for block
        i = 0
        for start, day_avg, day_sum in cur.fetchall():

            start_time = datetime.fromtimestamp(start)

            # JS needs epoch in ms, offset is to center bar
            start = start * 1000
            bar_center = int((start_time + ONE_DAY / 2).timestamp()) * 1000
            end = int((start_time + ONE_DAY).timestamp()) * 1000

            i_week = bisect_left(
                [week_obj['lookup'] for week_obj in self.json['week']],
                start)

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
        cur.execute("""
            SELECT watt_hours, start, part_type
            FROM hour
            ORDER BY start ASC;
            """)
        
        i = 0
        for value, start, part_type in cur.fetchall():

            # JS needs epoch in ms; the offset is to position the bar correctly
            start = start * 1000
            bar_center = middle * 1000
            end = end * 1000

            i_part = bisect_left(
                    [part_obj['lookup'] for part_obj in self.json['part']],
                    start)

            i_day = bisect_left(
                [day_obj['lookup'] for day_obj in self.json['day']],
                start)

            self.json['hour'].append({
                'x': bar_center,
                'y': value,

                'sum': value,

                'type': 'hour',
                'part': part_type,
                'interval_start': start,
                'interval_end': end,

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


