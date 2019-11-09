"""Classes and methods pertaining to the storage and analysis of ESPI data."""

import sqlite3
import os
import logging
import heapq

from pgesmd.helpers import parse_espi_data

_LOGGER = logging.getLogger(__name__)

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class EnergyHistory():
    """Class to hold PGE SMD SQL statements and simple database commands."""

    def __init__(self, path='/data/energy_history.db'):
        """Open the connection to database and create tables."""
        self.create_info_table = """
            CREATE TABLE IF NOT EXISTS info (
            max_watt_hour INTEGER,
            first_entry INTEGER,
            last_entry INTEGER);
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
                f'{PROJECT_PATH}{path}')
        except Exception as e:
            _LOGGER.error(e)

        try:
            self.cursor = self.conn.cursor()
            self.cursor.execute(self.create_espi_table)
            self.cursor.execute(self.create_daily_table)
            self.cursor.execute(self.create_info_table)
        except Exception as e:
            _LOGGER.error(e)

        self.cursor.execute("SELECT first_entry FROM info")
        try:
            self.first_entry = self.cursor.fetchone()[0]
        except TypeError:
            self.cursor.execute(
                "INSERT INTO info (first_entry) VALUES (?);", (4102444799,))
            self.cursor.execute("SELECT first_entry FROM info")
            self.first_entry = self.cursor.fetchone()[0]
            if not self.first_entry == 4102444799:
                _LOGGER.critical("TABLE 'info' did not initialize")

        self.cursor.execute("SELECT last_entry FROM info")
        try:
            self.last_entry = self.cursor.fetchone()[0]
        except TypeError:
            self.cursor.execute(
                "INSERT INTO info (last_entry) VALUES (?);", (0,))
            self.cursor.execute("SELECT first_entry FROM info")
            self.last_entry = self.cursor.fetchone()[0]
            if not self.last_entry == 0:
                _LOGGER.critical("TABLE 'info' did not initialize")

        self.cursor.execute("SELECT max_watt_hour FROM info")
        try:
            self.max_watt_hour = self.cursor.fetchone()[0]
        except TypeError:
            self.cursor.execute(
                "INSERT INTO info max_watt_hour) VALUES (?);", (0,))
            self.cursor.execute("SELECT first_entry FROM info")
            self.max_watt_hour = self.cursor.fetchone()[0]
            if not self.max_watt_hour == 0:
                _LOGGER.critical("TABLE 'info' did not initialize")

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
        date = next(parse_espi_data(xml_file))[4]
        min_heap = []

        def calculate_baseline(min_heap, baseline_points=baseline_points):
            return int(round(sum(heapq.nsmallest(
                baseline_points, min_heap)) / baseline_points))

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
            "UPDATE info SET first_entry = ?;", (self.first_entry,))
        self.cursor.execute(
            "UPDATE info SET last_entry = ?;", (self.last_entry,))
        self.cursor.execute(
            "UPDATE info SET max_watt_hour = ?;", (self.max_watt_hour,))

        self.cursor.execute("COMMIT")
