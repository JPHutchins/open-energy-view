import sqlite3
import os
import logging


_LOGGER = logging.getLogger(__name__)

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class EnergyHistory():
    def __init__(self, path='/data/energy_history.db'):
        """Open the connection to energy_history.db."""
        self.cursor = None
        self.create_table = """CREATE TABLE IF NOT EXISTS espi (
                                    start integer PRIMARY KEY,
                                    duration integer,
                                    value integer,
                                    watt_hours integer);
                            """

        self.insert_espi = """INSERT INTO espi (
                                start,
                                duration,
                                value,
                                watt_hours)
                                VALUES (?,?,?,?)
                            """

        self.conn = None

        try:
            self.conn = sqlite3.connect(
                f'{PROJECT_PATH}{path}')
        except Exception as e:
            _LOGGER.error(e)

        try:
            self.cursor = self.conn.cursor()
            self.cursor.execute(self.create_table)
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
        with self.conn:
            try:
                self.cursor.execute(self.insert_espi, espi_tuple)
            except sqlite3.IntegrityError:
                _LOGGER.info("Fall clock change, ignoring one hour.")
