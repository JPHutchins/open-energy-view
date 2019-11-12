"""Classes and methods pertaining to the storage and analysis of ESPI data."""

import sqlite3
import os
import logging
import heapq
import pytz
from datetime import datetime

from pgesmd.helpers import parse_espi_data, Crosses

_LOGGER = logging.getLogger(__name__)

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
timezone = pytz.timezone("US/Pacific")


class EnergyHistory():
    """Class to hold PGE SMD SQL statements and simple database commands."""

    def __init__(self,
                 path='/data/energy_history.db',
                 partitions=[
                     (0, "Night"),
                     (8, "Day"),
                     (16, "Evening")]):
        """Open the connection to database and create tables."""
        self.path = path
        self.partitions = partitions

        self.create_info_table = """
            CREATE TABLE IF NOT EXISTS info (
            id INTEGER PRIMARY KEY,
            max_watt_hour INTEGER DEFAULT 0,
            first_entry INTEGER DEFAULT 4102444799,
            last_entry INTEGER DEFAULT 0,
            n_parts INTEGER,
            part_1_name TEXT,
            part_1_time INTEGER,
            part_2_name TEXT,
            part_2_time INTEGER,
            part_3_name TEXT,
            part_3_time INTEGER,
            part_4_name TEXT,
            part_4_time INTEGER,
            part_5_name TEXT,
            part_5_time INTEGER);
            """
        self.create_espi_table = """
            CREATE TABLE IF NOT EXISTS espi (
            start INTEGER PRIMARY KEY,
            duration INTEGER,
            value INTEGER,
            watt_hours INTEGER,
            date TEXT);
            """
        self.create_daily_table = """
            CREATE TABLE IF NOT EXISTS daily (
            date TEXT PRIMARY KEY,
            baseline INTEGER);
            """
        self.create_partitions_table = """
            CREATE TABLE IF NOT EXISTS partitions (
            date TEXT,
            start INTEGER,
            part_1_avg INTEGER,
            part_1_sum INTEGER,
            part_2_avg INTEGER,
            part_2_sum INTEGER,
            part_3_avg INTEGER,
            part_3_sum INTEGER,
            part_4_avg INTEGER,
            part_4_sum INTEGER,
            part_5_avg INTEGER,
            part_5_sum INTEGER);
            """
        self.create_partitions_table_b = """
            CREATE TABLE IF NOT EXISTS partitions_b (
            start INTEGER,
            start_iso_8601,
            end INTEGER,
            end_iso_8601,
            middle INTEGER,
            middle_iso_8601,
            date TEXT,
            part_type INTEGER,
            part_name TEXT,
            part_desc TEXT,
            part_color TEXT,
            part_avg INTEGER,
            part_sum INTEGER);
            """
        self.insert_espi = """
            INSERT INTO espi (
            start,
            duration,
            value,
            watt_hours,
            date)
            VALUES (?,?,?,?,?);
            """
        self.insert_days = """
            INSERT INTO daily (
            date,
            baseline)
            VALUES (?,?);
            """

        try:
            self.conn = sqlite3.connect(
                f'{PROJECT_PATH}{self.path}')
        except Exception as e:
            _LOGGER.error(e)

        try:
            self.cursor = self.conn.cursor()
            self.cursor.execute(self.create_espi_table)
            self.cursor.execute(self.create_daily_table)
            self.cursor.execute(self.create_info_table)
            self.cursor.execute(self.create_partitions_table)
            self.cursor.execute(self.create_partitions_table_b)
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

        date = next(parse_espi_data(xml_file))[4]
        min_heap = []
        part_type = 0
        part_sum = 0
        part_start = next(parse_espi_data(xml_file))[0]
        c = Crosses(self.partitions[1][0])

        for entry in parse_espi_data(xml_file):
            #  Insert into the ESPI table
            self.cursor.execute(self.insert_espi, entry)

            #  Update the info about the data
            if entry[0] < self.first_entry:
                self.first_entry = entry[0]
            if entry[0] > self.last_entry:
                self.last_entry = entry[0]
            if entry[3] > self.max_watt_hour:
                self.max_watt_hour = entry[3]

            #  Calculate the daily partitions
            espi_time = get_hours_mins(entry[0])
            if not c.test(espi_time):
                part_sum += entry[3]
                part_date = entry[4]
            else:
                part_name = self.partitions[part_type][1]
                part_end = entry[0]
                part_end_iso = timezone.localize(
                    datetime.utcfromtimestamp(part_end))
                part_interval = part_end - part_start
                part_avg = part_sum / part_interval * 3600
                part_middle = part_start + (part_interval / 2)
                part_middle_iso = timezone.localize(
                    datetime.utcfromtimestamp(part_middle))
                part_start_iso = timezone.localize(
                    datetime.utcfromtimestamp(part_start))
                self.cursor.execute(f"""
                    INSERT INTO partitions_b (
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
                    part_avg,
                    part_sum)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?);
                    """, (
                        part_start,
                        part_start_iso,
                        part_end,
                        part_end_iso,
                        part_middle,
                        part_middle_iso,
                        part_date,
                        part_type,
                        part_name,
                        self.part_desc[part_type],
                        part_avg,
                        part_sum))

                if part_type < len(self.partitions) - 1:
                    part_type += 1
                    c = Crosses(self.partitions[
                        (part_type + 1) % len(self.partitions)]
                        [0])
                else:
                    part_type = 0
                    c = Crosses(self.partitions[1][0])

                part_sum = entry[3]
                part_start = entry[0]

            #  Keep track of daily values
            min_heap.append(entry[3])

            #  Push daily changes
            if not entry[4] == date:
                baseline = calculate_baseline(min_heap)
                self.cursor.execute(self.insert_days, (date, baseline))
                min_heap = []
                date = entry[4]

        #  Push the data from the last day
        baseline = calculate_baseline(min_heap)
        self.cursor.execute(self.insert_days, (date, baseline))

        #  Update the info table
        self.cursor.execute(
            "UPDATE info SET first_entry = ? WHERE id=0;", (self.first_entry,))
        self.cursor.execute(
            "UPDATE info SET last_entry = ? WHERE id=0;", (self.last_entry,))
        self.cursor.execute(
            "UPDATE info SET max_watt_hour = ? WHERE id=0;", (self.max_watt_hour,))

        #  Commit changes to the database
        self.cursor.execute("COMMIT")
