"""Test the functions and methods in pgesmd.helpers."""

import unittest
import os
import time
from pstats import Stats
import cProfile
import json

from pgesmd.helpers import (
    get_auth_file,
    parse_espi_data
)
from pgesmd.database import EnergyHistory


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

    def setUp(self):
        self.pr = cProfile.Profile()
        self.pr.enable()
        print("\n<<<---")
    
    def tearDown(self):
        p = Stats(self.pr)
        p.strip_dirs()
        p.sort_stats('cumtime')
        p.print_stats()
        print("\n--->>>")

    def test_get_auth_file(self):
        """Test get_auth_file()."""
        self.assertEqual(get_auth_file('bad_path'), None)
        self.assertEqual(
            get_auth_file(f'{PROJECT_PATH}/test/auth/bad.json'), None)
        self.assertEqual(
            get_auth_file(f'{PROJECT_PATH}/test/auth/auth.json'), (
                '55555',
                'fake_client_id',
                'fake_client_secret',
                '/home/jp/pgesmd/test/cert/cert.crt',
                '/home/jp/pgesmd/test/cert/private.key'))

    def test_parse_espi(self):
        """Test parse_espi_data()."""
        xml = f'{PROJECT_PATH}/test/data/espi/espi_1_day.xml'
        for entry, answer in zip(parse_espi_data(xml), answers):
            self.assertEqual(entry, answer)

        xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
        dump = []
        for entry in parse_espi_data(xml):
            dump.append(entry)

        #  17,496 hours / 24 = 729 days of data
        self.assertEqual(len(dump), 17496)

        #  check first and last data points, see actual XML file
        self.assertEqual(dump[0], (1508396400, 3600, 446800, 447, '2017-10-19'))
        self.assertEqual(dump[17495], (1571378400, 3600, 1643400, 1643,
                         '2019-10-17'))
        start = time.strftime(
            '%Y-%m-%d %H:%M:%S',
            time.localtime(int(dump[0][0])))
        end = time.strftime(
            '%Y-%m-%d %H:%M:%S',
            time.localtime(int(dump[17495][0]) + int(dump[17495][1])))

    def test_database_write(self):
        """Verify integrity of data after SQL INSERT."""
        query = "SELECT value FROM hour WHERE start=?"

        db = EnergyHistory(path='/test/data/energy_history_test.db',
                           json_path='/test/data/energy_history_test.json')
        xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
        db.insert_espi_xml(xml)

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
    
    def test_database_json_export(self):
        db = EnergyHistory(path='/test/data/energy_history_test.db',
                           json_path='/test/data/energy_history_test.json')
        xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
        db.insert_espi_xml(xml)

        db.save_json()
        db_json = db.get_json()
        filename = f'{PROJECT_PATH}/test/data/energy_history_test.json'
        with open(filename, 'w') as json_file:
            json.dump(db_json, json_file)
        
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
            (('week', 0), (1508396400, 1508738400)),    # Week ending 2017-10-22
            (('week', 1), (1508742000, 1509343200)),    # Week, M-M, 2017-10-23
            (('week', -1), (1571036400, 1571378400)),   # Week starting 2019-10-14

            (('month', 0), (1508396400, 1509516000)),   # October 2017, partial
            (('month', 1), (1509519600, 1512111600)),   # November 2017, complete
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
            self.assertEqual(intvl_sum, db_json[period][i]['sum'])
            self.assertEqual(intvl_avg, db_json[period][i]['y'])

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
                           json_path='/test/data/energy_history_test.json')
        xml = f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml'
        db.insert_espi_xml(xml)

        db.save_json()
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
                    self.assertEqual(per_start, db_json[res][lo]['interval_start'])
                    self.assertEqual(per_end, db_json[res][hi-1]['interval_end'])
                except AssertionError as e:
                    print(f'ERROR: {e}')
                    print(f'period: {period}, i: {i}\n'
                        f'per_start: {per_start}, per_end: {per_end}\n'
                        f'l: {lo}, r: {hi}\n')
                    raise AssertionError






if __name__ == '__main__':
    unittest.main()
