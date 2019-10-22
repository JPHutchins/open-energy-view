import unittest
import os
import time

from pgesmd.helpers import (
    get_auth_file,
    parse_espi_data
)


PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
print(f'Testing in: {PROJECT_PATH}')


answers = [
           (1570086000, 3600, 1067300, 1067),
           (1570089600, 3600, 916900, 916),
           (1570093200, 3600, 912000, 912),
           (1570096800, 3600, 759100, 759),
           (1570100400, 3600, 594400, 594),
           (1570104000, 3600, 650500, 650),
           (1570107600, 3600, 676900, 676),
           (1570111200, 3600, 759600, 759),
           (1570114800, 3600, 695900, 695),
           (1570118400, 3600, 853500, 853),
           (1570122000, 3600, 1229500, 1229),
           (1570125600, 3600, 871100, 871),
           (1570129200, 3600, 826900, 826),
           (1570132800, 3600, 1042899, 1042),
           (1570136400, 3600, 1233600, 1233),
           (1570140000, 3600, 1115900, 1115),
           (1570143600, 3600, 1331000, 1331),
           (1570147200, 3600, 3363100, 3363),
           (1570150800, 3600, 4870100, 4870),
           (1570154400, 3600, 5534300, 5534),
           (1570158000, 3600, 5541900, 5541),
           (1570161600, 3600, 6296300, 6296),
           (1570165200, 3600, 5372200, 5372),
           (1570168800, 3600, 4148399, 4148)
           ]


class TestHelpers(unittest.TestCase):
    def setUp(self):
        pass

    def test_get_auth_file(self):
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
        self.assertEqual(dump[0], (1508396400, 3600, 446800, 446))
        self.assertEqual(dump[17495], (1571378400, 3600, 1643400, 1643))
        start = time.strftime(
            '%Y-%m-%d %H:%M:%S',
            time.localtime(int(dump[0][0])))
        end = time.strftime(
            '%Y-%m-%d %H:%M:%S',
            time.localtime(int(dump[17495][0]) + int(dump[17495][1])))
        print(f"\nParsed two year data feed from {start} through {end}")


if __name__ == '__main__':
    unittest.main()
