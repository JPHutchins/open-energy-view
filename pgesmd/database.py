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
        except Exception as e:
            _LOGGER.error(e)

    def insert_espi_xml(self, xml_file, baseline_points=3):
        """Insert an ESPI XML file into the database.

        The TABLE "espi" is updated with the raw ESPI data as well as a field,
        watt_hours, that has converted the field, value, to Watt hours; and a
        field, date, that is the date corresponding to the reading in YY/MM/DD.

        The TABLE "daily" is updated with a date for each day on which data was
        pulled as well as the field, basline, which is the average of the
        <baseline_points> lowest values read that day.

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

            if not entry[4] == date:
                baseline = calculate_baseline(min_heap)
                self.cursor.execute(self.insert_days, (date, baseline))
                min_heap = []
                date = entry[4]

        baseline = calculate_baseline(min_heap)
        self.cursor.execute(self.insert_days, (date, baseline))

        self.cursor.execute("COMMIT")
