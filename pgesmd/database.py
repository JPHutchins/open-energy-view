"""Classes and methods pertaining to the storage and analysis of ESPI data."""

import sqlite3
import os
import logging
import heapq
from datetime import datetime

from pgesmd.helpers import parse_espi_data

_LOGGER = logging.getLogger(__name__)

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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
            part_1 INTEGER,
            part_2 INTEGER,
            part_3 INTEGER,
            part_4 INTEGER,
            part_5 INTEGER);
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

        def calculate_daily_partitions(espi_tuple, ):
            time = datetime.fromtimestamp(espi_tuple[0])
            time = time.strftime('%H') + (time.strftime('%M') / 60)

        date = next(parse_espi_data(xml_file))[4]
        min_heap = []

        for entry in parse_espi_data(xml_file):
            min_heap.append(entry[3])
            self.cursor.execute(self.insert_espi, entry)

            if entry[0] < self.first_entry:
                self.first_entry = entry[0]

            if entry[0] > self.last_entry:
                self.last_entry = entry[0]

            if entry[3] > self.max_watt_hour:
                self.max_watt_hour = entry[3]

            if not entry[4] == date:
                baseline = calculate_baseline(min_heap)
                self.cursor.execute(self.insert_days, (date, baseline))
                min_heap = []
                date = entry[4]

        baseline = calculate_baseline(min_heap)
        self.cursor.execute(self.insert_days, (date, baseline))

        self.cursor.execute(
            "UPDATE info SET first_entry = ? WHERE id=0;", (self.first_entry,))
        self.cursor.execute(
            "UPDATE info SET last_entry = ? WHERE id=0;", (self.last_entry,))
        self.cursor.execute(
            "UPDATE info SET max_watt_hour = ? WHERE id=0;", (self.max_watt_hour,))

        self.cursor.execute("COMMIT")
