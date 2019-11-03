import sqlite3
import os
import logging

from pgesmd.helpers import parse_espi_data

_LOGGER = logging.getLogger(__name__)

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class EnergyHistory():
    def __init__(self, path='/data/energy_history.db'):
        """Open the connection to energy_history.db."""
        self.create_espi_table = """CREATE TABLE IF NOT EXISTS espi (
                                    start INTEGER PRIMARY KEY,
                                    duration INTEGER,
                                    value INTEGER,
                                    watt_hours INTEGER,
                                    date TEXT);

                                """
        self.create_daily_table = """CREATE TABLE IF NOT EXISTS daily (
                                     date TEXT PRIMARY KEY,
                                     baseline INTEGER);
                                  """
        self.insert_espi = """INSERT INTO espi (
                                start,
                                duration,
                                value,
                                watt_hours,
                                date)
                                VALUES (?,?,?,?,?);
                            """
        self.insert_days = """INSERT INTO daily (
                               date)
                               VALUES (?);
                            """
        self.conn = None

        try:
            self.conn = sqlite3.connect(
                f'{PROJECT_PATH}{path}')
        except Exception as e:
            _LOGGER.error(e)

        self.cursor = None
        try:
            self.cursor = self.conn.cursor()
            self.cursor.execute(self.create_espi_table)
            self.cursor.execute(self.create_daily_table)
        except Exception as e:
            _LOGGER.error(e)

    def create_table(self, create_table_sql):
        """Create a table from the create_table_sql statement."""
        try:
            self.cursor = self.conn.cursor()
            self.cursor.execute(create_table_sql)
        except Exception as e:
            _LOGGER.error(e)

    def add_espi_to_table(self, espi_tuple):
        """The espi tuple is (
            [start in UTC seconds],
            [dutation in seconds],
            [raw value from ESPI XML],
            [raw value converted to watt hours]
            )
        """
        try:
            self.cursor.execute(self.insert_espi, espi_tuple)
        except sqlite3.IntegrityError:
            _LOGGER.info("Fall clock change, ignoring one hour.")
    
    def insert_espi_xml(self, xml_file):
        """Insert an ESPI XML file into the TABLE "espi".
        
        Additionally, the TABLE "daily" is updated with any dates that
        correspond to the ESPI data.
        """
        date = None
        for entry in parse_espi_data(xml_file):
            self.cursor.execute(self.insert_espi, entry)
            if not entry[4] == date:
                date = entry[4]
                self.cursor.execute(self.insert_days, (date,))
        self.cursor.execute("COMMIT")
