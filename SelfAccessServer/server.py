from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import requests
import json
from base64 import b64encode

TOKEN_URL = 'https://api.pge.com/datacustodian/test/oauth/v2/token'
CERT_PATH = './cert/cert.crt'
KEY_PATH = './cert/private.key'
AUTH_PATH = './auth/auth.json'

class ClientCredentials:
    def __init__(self, client_id, client_secret, cert_crt, cert_key):
        self.client_id = client_id
        self.client_secret = client_secret
        self.cert = (cert_crt, cert_key)
        self.auth_header = None

    def get_auth_header(self):
        _client_id = self.get_client_id()
        _client_secret = self.get_client_secret()

        b64 = b64encode(
            f'{_client_id}:{_client_secret}'.encode('utf-8'))
        b64_string = bytes.decode(b64)
        self.auth_header = f'Basic {b64_string}'
    
    def get_cert(self):
        def get_path(kind):
            return input(f"SSL {kind} path: ")
        
        cert_info = [self.cert[0], self.cert[1]]

        if not cert_info[0]:
            cert_info[0] = get_path("crt")
        
        if not cert_info[1]:
            cert_info[1] = get_path("key")
        
        self.cert = (cert_info[0], cert_info[1])

    def get_client_id(self):
        if self.client_id:
            return self.client_id
        self.client_id = input("PG&E Client_ID: ")
        return self.client_id

    def get_client_secret(self):
        if self.client_secret:
            return self.client_secret
        self.client_secret = input("PG&E Client_Secret: ")
        return self.client_secret

    def get_access_token(self):
        if not self.auth_header:
            self.get_auth_header()
        
        if not self.cert[0] or self.cert[1]:
            self.get_cert()

        request_params = {'grant_type': 'client_credentials'}
        header_params = {'Authorization' : self.auth_header}

        print(header_params)

        response = requests.post(
            TOKEN_URL,
            data = request_params,
            headers = header_params,
            cert = self.cert)

        if str(response.status_code) == "200":
            res = response.json()
            res.update({"status": response.status_code})
            return res
        return {"status": response.status_code, "error": response.text}

class holder:
    def __init__(self):
        self.messages = []

    def add_message(self, message):
        self.messages.append(message)

    def print(self):
        print([message for message in self.messages])

def catalog(data, library):
    library.add_message(data)
    library.print()

class handler(BaseHTTPRequestHandler):

    library = holder()

    def do_POST(self):
        if self.path == '/pgesmd':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            content_len = int(self.headers.get('Content-Length'))
            body = self.rfile.read(content_len)
            catalog(body, self.library)


def run(server_class=HTTPServer):
    server_address = ('', 7999)
    httpd = server_class(server_address, handler)
    httpd.serve_forever()

if __name__ == '__main__':

    client_id = None
    client_secret = None

    try:
        with open(AUTH_PATH) as auth:
            data = auth.read()
            json = json.loads(data)
            try:
                client_id = json["client_id"]
                client_secret = json["client_secret"]
            except KeyError:
                print("Auth file should be JSON with fields: \n"
                      "\"client_id\": and \"client_secret\":")
                

    except FileNotFoundError:
        print("Auth file not found.")

    creds = ClientCredentials(client_id,
                              client_secret,
                              CERT_PATH,
                              KEY_PATH)

    print(creds.get_access_token())

    try:
        run()
    except KeyboardInterrupt:
        pass
