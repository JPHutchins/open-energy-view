import unittest
import os

from api import SelfAccessApi

PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))
print(f'Testing in: {PROJECT_PATH}')
THIRD_PARTY_ID = '55555'


class TestSelfAccessApi(unittest.TestCase):
    def test_constructor(self):
        with self.assertRaises(TypeError):
            SelfAccessApi()

    def setUp(self):
        self.api = SelfAccessApi('55555',
                                 'client_id',
                                 'client_secret',
                                 './certpath/cert.crt',
                                 './keypath/private.key')

    def test_get_auth_header(self):
        self.api.get_auth_header()
        self.assertEqual(self.api.auth_header,
                         'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=')


if __name__ == '__main__':
    unittest.main()
