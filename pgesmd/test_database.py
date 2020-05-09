"""Test the functions and methods in pgesmd.database."""

import unittest
import os
import time
from pstats import Stats
import cProfile
import json

from pgesmd.database import EnergyHistory
from . import create_app



PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

answers = [
           (1570086000, 3600, 1067300, 1067, '2019-10-03'),
           (1570089600, 3600, 916900, 917, '2019-10-03'),
           (1570093200, 3600, 912000, 912, '2019-10-03'),
           (1570096800, 3600, 759100, 759, '2019-10-03'),
           (1570100400, 3600, 594400, 594, '2019-10-03'),
           (1570104000, 3600, 650500, 650, '2019-10-03'),
           (1570107600, 3600, 676900, 677, '2019-10-03'),
           (1570111200, 3600, 759600, 760, '2019-10-03'),
           (1570114800, 3600, 695900, 696, '2019-10-03'),
           (1570118400, 3600, 853500, 854, '2019-10-03'),
           (1570122000, 3600, 1229500, 1230, '2019-10-03'),
           (1570125600, 3600, 871100, 871, '2019-10-03'),
           (1570129200, 3600, 826900, 827, '2019-10-03'),
           (1570132800, 3600, 1042899, 1043, '2019-10-03'),
           (1570136400, 3600, 1233600, 1234, '2019-10-03'),
           (1570140000, 3600, 1115900, 1116, '2019-10-03'),
           (1570143600, 3600, 1331000, 1331, '2019-10-03'),
           (1570147200, 3600, 3363100, 3363, '2019-10-03'),
           (1570150800, 3600, 4870100, 4870, '2019-10-03'),
           (1570154400, 3600, 5534300, 5534, '2019-10-03'),
           (1570158000, 3600, 5541900, 5542, '2019-10-03'),
           (1570161600, 3600, 6296300, 6296, '2019-10-03'),
           (1570165200, 3600, 5372200, 5372, '2019-10-03'),
           (1570168800, 3600, 4148399, 4148, '2019-10-03')
           ]



class TestHelpers(unittest.TestCase):
    """Test pgesmd.helpers."""

    @classmethod
    def setUpClass(cls):
        create_app()

    def setUp(self):
        pass
        # self.pr = cProfile.Profile()
        # self.pr.enable()
        # print("\n<<<---")

    def tearDown(self):
        db = EnergyHistory(path='/test/data/energy_history_test.db',
                           json_path='/test/data/energy_history_test.json')
        db.delete_data()
        # p = Stats(self.pr)
        # p.strip_dirs()
        # p.sort_stats('cumtime')
        # p.print_stats()
        # print("\n--->>>")

    def test_database_write(self):
        """Verify integrity of data after SQL INSERT."""
        query = "SELECT value FROM hour WHERE start=?"

        db = EnergyHistory(path='/test/data/energy_history_test.db',
                           json_path='/test/data/energy_history_test.json')
        xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
        db.insert_espi_xml(xml, 13371337)

        cur = db.cursor

        starts = [(1508396400, 446800), (1571378400, 1643400)]

        for start, answer in starts:
            cur.execute(query, (start,))
            result = cur.fetchall()
            self.assertEqual(result[0][0], answer)

        cur.execute("SELECT first_entry FROM info WHERE id=0")
        self.assertEqual(starts[0][0], db.first_entry)
        self.assertEqual(starts[0][0], cur.fetchone()[0])

        cur.execute("SELECT last_entry FROM info WHERE id=0")
        self.assertEqual(starts[1][0], db.last_entry)
        self.assertEqual(starts[1][0], cur.fetchone()[0])

        cur.execute("SELECT max_watt_hour FROM info WHERE id=0")
        self.assertEqual(7948, db.max_watt_hour)
        self.assertEqual(7948, cur.fetchone()[0])

    def test_database_add(self):
        """Test adding new data to the DB."""
        # if os.path.exists(f'{PROJECT_PATH}/test/data/energy_history_test.db'):
        #     os.remove(f'{PROJECT_PATH}/test/data/energy_history_test.db')

        query = "SELECT value FROM hour WHERE start=?"

        db = EnergyHistory(path='/test/data/energy_history_test.db',
                           json_path='/test/data/energy_history_test.json')

        xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
        db.insert_espi_xml(xml, 13371337)

        last_day_xml = f'{PROJECT_PATH}/test/data/espi/Single Days/2019-10-17.xml'
        db.insert_espi_xml(last_day_xml, 13371337)

        cur = db.cursor

        starts = [(1508396400, 446800), (1571378400, 1643400)]

        for start, answer in starts:
            cur.execute(query, (start,))
            result = cur.fetchall()
            self.assertEqual(result[0][0], answer)

        cur.execute("SELECT first_entry FROM info WHERE id=0")
        self.assertEqual(starts[0][0], db.first_entry)
        self.assertEqual(starts[0][0], cur.fetchone()[0])

        cur.execute("SELECT last_entry FROM info WHERE id=0")
        self.assertEqual(starts[1][0], db.last_entry)
        self.assertEqual(starts[1][0], cur.fetchone()[0])

        cur.execute("SELECT max_watt_hour FROM info WHERE id=0")
        self.assertEqual(7948, db.max_watt_hour)
        self.assertEqual(7948, cur.fetchone()[0])

        next_day_xml = f'{PROJECT_PATH}/test/data/espi/Single Days/2019-10-16.xml'
        db.insert_espi_xml(next_day_xml, 13371337)
        starts = [(1508396400, 446800), (1571378400, 1643400)]
        for start, answer in starts:
            cur.execute(query, (start,))
            result = cur.fetchall()
            self.assertEqual(result[0][0], answer)

        next_day_xml = f'{PROJECT_PATH}/test/data/espi/Single Days/2019-10-16.xml'
        self.assertFalse(db.is_sequential(next_day_xml))

        next_day_xml = f'{PROJECT_PATH}/test/data/espi/Single Days/2019-10-17.xml'
        self.assertFalse(db.is_sequential(next_day_xml))

        next_day_xml = f'{PROJECT_PATH}/test/data/espi/Single Days/2019-10-18.xml'
        self.assertTrue(db.is_sequential(next_day_xml))
        db.insert_espi_xml(next_day_xml, 13371337)
        starts = [(1508396400, 446800), (1571382000, 1089700)]
        for start, answer in starts:
            cur.execute(query, (start,))
            result = cur.fetchall()
            self.assertEqual(result[0][0], answer)
        cur.execute("SELECT day_avg FROM day WHERE start=1571295600")
        self.assertEqual(1243, *cur.fetchone())
        cur.execute("SELECT day_avg FROM day WHERE start=1571382000")
        self.assertEqual(1569, *cur.fetchone())

        #  Cut that out, let's insert the rest of October!
        for day in range(19, 32):
            db.insert_espi_xml(
                f'{PROJECT_PATH}/test/data/espi/Single Days/2019-10-{day}.xml',
                13371337)

        week_start = 1571036400
        week_end = week_start + 604800 - 3600
        cur.execute("SELECT week_avg FROM week WHERE start=?", (week_start,))
        week_avg = cur.fetchone()[0]
        cur.execute(
            "SELECT watt_hours FROM hour WHERE start BETWEEN ? AND ?",
            (week_start, week_end))
        hour_list = [x[0] for x in cur.fetchall()]
        week_summed_avg = int(round(sum(hour_list) / len(hour_list)))
        self.assertAlmostEqual(week_summed_avg, week_avg)

    def test_database_json_export(self):
        # if os.path.exists(f'{PROJECT_PATH}/test/data/energy_history_test.db'):
        #     os.remove(f'{PROJECT_PATH}/test/data/energy_history_test.db')

        db = EnergyHistory(path='/test/data/energy_history_test.db',
                           json_path='/test/data/energy_history_test.json',
                           partitions=[
                               (22, "Night"),
                               (6, "Day"),
                               (17, "Evening")])
        xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
        db.insert_espi_xml(xml, 13371337)

        db.save_json(13371337)
        db_json = db.get_json()

        #  Check first and last entries
        self.assertEqual(447, db_json['hour'][0]['y'])
        self.assertEqual(1643, db_json['hour'][17495]['y'])

        self.assertEqual(408, db_json['part'][0]['y'])
        self.assertEqual(2440, db_json['part'][2187]['y'])

        first_day_avg = sum([i['y'] for i in db_json['hour'][0:24]]) / 24
        last_day_avg = sum([i['y'] for i in db_json['hour'][17472:17496]]) / 24
        self.assertEqual(int(round(first_day_avg)), db_json['day'][0]['y'])
        self.assertEqual(int(round(last_day_avg)), db_json['day'][728]['y'])

        cur = db.cursor

        test_intvls = [
            (('week', 0), (1508396400, 1508738400)),    # Week ends 2017-10-22
            (('week', 1), (1508742000, 1509343200)),    # Week, M-M, 2017-10-23
            (('week', -1), (1571036400, 1571378400)),   # Week start 2019-10-14

            (('month', 0), (1508396400, 1509516000)),   # October 2017, partial
            (('month', 1), (1509519600, 1512111600)),   # November 2017, total
            (('month', -1), (1569913200, 1571378400)),  # October 2019, partial

            (('year', 1), (1514793600, 1546326000))
            ]

        for rng, intvl in test_intvls:
            cur.execute("""
                        SELECT watt_hours FROM hour 
                        WHERE start BETWEEN ? AND ?;
                        """, intvl)
            intvl_list = [x[0] for x in cur.fetchall()]
            intvl_sum = sum(intvl_list)
            intvl_avg = int(round(intvl_sum / len(intvl_list)))
            period, i = rng
            try:
                self.assertEqual(intvl_sum, db_json[period][i]['sum'])
                self.assertEqual(intvl_avg, db_json[period][i]['y'])
            except IndexError as e:
                print(f"Index out of range: {i}, on list: {period}")
                raise e

    def test_json_indexing(self):
        """Test the indexing of the JSON file.

        Each object in the JSON stores indexes that correspond to the
        boundaries of the associated hourly data.  For example, a "day" will
        contain the keys "i_hour_start" and "i_hour_end".  These indexes
        can be used to slice the hour list like:

        lo = json['day'][0]['i_hour_start']
        hi = json['day'][0]['i_hour_end']

        json['hour'][lo:hi]
        or
        json['hour'].slice(lo, hi)

        This will yield a subarray containing the higher resolution data
        corresponding to the original data.

        Furthermore, each object stores keys like "i_month" or "i_day".  These
        indexes will point to the larger time interval of which the current
        object is a slice.
        """
        db = EnergyHistory(path='/test/data/energy_history_test.db',
                           json_path='/test/data/energy_history_test.json',
                           partitions=[
                               (22, "Night"),
                               (6, "Day"),
                               (17, "Evening")])
        xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
        db.insert_espi_xml(xml, 13371337)

        db.save_json(13371337)
        db_json = db.get_json()
        
        test_intvls = [
            ('day', 0),
            ('day', -1),
            ('part', 0),
            ('part', 1),
            ('part', -1),
            ('week', 0),
            ('week', 1),
            ('week', -1),
            ('month', 0),
            ('month', 1),
            ('month', -1),
            ('year', 0),
            ('year', 1),
            ('year', -1)
        ]

        for period, i in test_intvls:
            per_sum = db_json[period][i]['sum']
            per_start = db_json[period][i]['interval_start']
            per_end = db_json[period][i]['interval_end']

            index_res = [
                ('i_hour_start', 'i_hour_end', 'hour'),
                ('i_day_start', 'i_day_end', 'day'),
                ('i_month_start', 'i_month_end', 'month')
            ]

            test_res = []

            if period == ('day' or 'part'):
                test_res = index_res[:1]
            elif period == ('week' or 'month'):
                test_res = index_res[:2]
            elif period == 'year':
                test_res = index_res[:3]

            for test in test_res:
                start, end, res = test
                lo = db_json[period][i][start]
                hi = db_json[period][i][end]

                try:
                    if res == 'hour':
                        hour_sum = sum([x['y'] for x in db_json[res][lo:hi]])
                        self.assertEqual(per_sum, hour_sum)
                    self.assertEqual(
                        per_start, db_json[res][lo]['interval_start'])
                    self.assertEqual(
                        per_end, db_json[res][hi-1]['interval_end'])
                except AssertionError as e:
                    print(f'ERROR: {e}')
                    print(f'period: {period}, i: {i}\n'
                          f'per_start: {per_start}, per_end: {per_end}\n'
                          f'l: {lo}, r: {hi}\n')
                    raise AssertionError

if __name__ == '__main__':
    unittest.main()