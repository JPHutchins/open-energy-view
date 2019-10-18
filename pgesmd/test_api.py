import unittest
import os
import threading
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

from api import SelfAccessApi

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
                                 f'{PROJECT_PATH}/test/cert/cert.crt',
                                 f'{PROJECT_PATH}/test/cert/private.key',
                                 token_uri='http://localhost:8999/token')
    
    def test_checkRI(self):
        self.assertTrue(checkRI(self.api))
        self.api.client_secret = None
        self.assertFalse(checkRI(self.api))
        self.api.client_secret = 'client_secret'
        self.assertTrue(checkRI(self.api))

    def test_auth_header(self):
        self.assertTrue(checkRI(self.api))

        self.assertEqual(self.api.auth_header,
                         'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=')

        self.assertTrue(checkRI(self.api))

    def test_get_access_token(self):
        self.assertTrue(checkRI(self.api))

        self.assertEqual(self.api.get_access_token(), 'the-token')

        self.assertTrue(checkRI(self.api))


class FakeServer(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        response = '{"client_access_token": "the-token", "expires_in": "3600"}'
        response = json.loads(response)
        
        if self.path == '/token':
            self.wfile.write(json.dumps(response).encode("utf8"))
            return

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write("Alive!\n".encode("utf8"))

if __name__ == '__main__':
    httpd = HTTPServer(("localhost", 8999), FakeServer)
    server = threading.Thread(target=httpd.serve_forever)
    server.daemon = True
    server.start()

    unittest.main()

    server.httpd.shutdown()
