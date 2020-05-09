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
        xml_fp = open(f'{PROJECT_PATH}/test/data/espi/espi_1_day.xml', 'r')
        xml = xml_fp.read()
        for entry, answer in zip(parse_espi_data(xml), answers):
            self.assertEqual(entry, answer)
        xml_fp.close()

        xml_fp = open(f'{PROJECT_PATH}/test/data/espi/espi_2_years.xml', 'r')
        xml = xml_fp.read()
        dump = []
        for entry in parse_espi_data(xml):
            dump.append(entry)
        xml_fp.close()
        #  17,496 hours / 24 = 729 days of data
        self.assertEqual(len(dump), 17496)

        #  check first and last data points, see actual XML file
        self.assertEqual(dump[0],
                         (1508396400, 3600, 446800, 447, '2017-10-19'))
        self.assertEqual(dump[17495], (1571378400, 3600, 1643400, 1643,
                         '2019-10-17'))
        start = time.strftime(
            '%Y-%m-%d %H:%M:%S',
            time.localtime(int(dump[0][0])))
        end = time.strftime(
            '%Y-%m-%d %H:%M:%S',
            time.localtime(int(dump[17495][0]) + int(dump[17495][1])))


if __name__ == '__main__':
    unittest.main()
