"""Test the Flask GUI."""

import os

from pgesmd.database import EnergyHistory

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def fill_database():
    """Fill database using the test data."""
    if os.path.exists(f'{PROJECT_PATH}/test/data/energy_history_test.db'):
        os.remove(f'{PROJECT_PATH}/test/data/energy_history_test.db')
    db = EnergyHistory(path='/test/data/energy_history_test.db')
    xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
    db.insert_espi_xml(xml)
    print(f"Filled database with data from {xml}")


if __name__ == '__main__':
    fill_database()
