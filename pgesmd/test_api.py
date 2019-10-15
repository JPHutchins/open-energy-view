import unittest
import os

from api import SelfAccessApi

PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))
print(f'Testing in: {PROJECT_PATH}')
THIRD_PARTY_ID = '55555'


def checkRI(api):
    """These attributes are immutable and should not be reassigned."""
    if (not api.third_party_id or
        not api.client_id or
        not api.client_secret or
        not api.cert):
        return False
    return True


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
    
    def test_checkRI(self):
        self.assertTrue(checkRI(self.api))
        self.api.client_secret = None
        self.assertFalse(checkRI(self.api))
        self.api.client_secret = 'client_secret'
        self.assertTrue(checkRI(self.api))

    def test_get_auth_header(self):
        self.assertTrue(checkRI(self.api))

        self.api.get_auth_header()
        self.assertEqual(self.api.auth_header,
                         'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=')

        self.assertTrue(checkRI(self.api))

if __name__ == '__main__':
    unittest.main()
