from http.server import BaseHTTPRequestHandler, HTTPServer
import requests
import json
import ssl
import xml.etree.ElementTree as ET
from base64 import b64encode

# Enter your Third Party ID as listed in the Share My Data portal.
THIRD_PARTY_ID = '50916'

# Update the files referenced below with your credentials.
CERT_PATH = './cert/cert.crt'
KEY_PATH = './cert/private.key'
AUTH_PATH = './auth/auth.json'

# Port forwarding.  Forward 443 to this application:PORT.
PORT = 7999

TOKEN_URL = 'https://api.pge.com/datacustodian/test/oauth/v2/token'
UTILITY_URI = 'https://api.pge.com'
API_URI = '/GreenButtonConnect/espi'
BULK_RESOURCE_URI =\
    f'{UTILITY_URI}{API_URI}/1_1/resource/Batch/Bulk/{THIRD_PARTY_ID}'


class SelfAccessApi:
    """Representaiton of the PG&E SMD API for Self Access Users."""
    def __init__(self, client_id, client_secret, cert_crt, cert_key):
        self.client_id = client_id
        self.client_secret = client_secret
        self.cert = (cert_crt, cert_key)
        self.auth_header = None
        self.access_token = None

    def get_auth_header(self):
        """Return the value for Authorization header."""
        _client_id = self.get_client_id()
        _client_secret = self.get_client_secret()

        b64 = b64encode(
            f'{_client_id}:{_client_secret}'.encode('utf-8'))
        b64_string = bytes.decode(b64)
        self.auth_header = f'Basic {b64_string}'

        return self.auth_header

    def get_cert(self):
        """Return the tuple ([public certificate], [private key])"""
        def get_path(kind):
            return input(f"SSL {kind} path: ")

        cert_info = [self.cert[0], self.cert[1]]

        if not cert_info[0]:
            cert_info[0] = get_path("crt")

        if not cert_info[1]:
            cert_info[1] = get_path("key")

        self.cert = (cert_info[0], cert_info[1])

        return self.cert

    def get_client_id(self):
        """Return the PGE SMD Client_ID. Ask user if missing."""
        if self.client_id:
            return self.client_id
        self.client_id = input("PG&E Client_ID: ")
        return self.client_id

    def get_client_secret(self):
        """Return the PGE SMD Client_Secret. Ask user if missing."""
        if self.client_secret:
            return self.client_secret
        self.client_secret = input("PG&E Client_Secret: ")
        return self.client_secret

    def get_access_token(self):
        """Request and return access token from the PGE SMD Servers."""
        if not self.auth_header:
            self.get_auth_header()

        if not self.cert[0] or self.cert[1]:
            self.get_cert()

        request_params = {'grant_type': 'client_credentials'}
        header_params = {'Authorization': self.auth_header}

        response = requests.post(
            TOKEN_URL,
            data=request_params,
            headers=header_params,
            cert=self.cert)

        if str(response.status_code) == "200":
            self.access_token = response.json()['client_access_token']
            return self.access_token
        print({"status": response.status_code, "error": response.text})

    def async_request(self):
        """Return True upon successful asynchronous request."""
        header_params = {'Authorization': f'Bearer {self.access_token}'}

        response = requests.get(
            BULK_RESOURCE_URI,
            data={},
            headers=header_params,
            cert=self.cert
        )
        if str(response.status_code) == "202":
            print("Request successful, awaiting POST from server.")
            return True
        print({"status": response.status_code,
               "error": response.text})
        return False

    def get_resource_uri(self, xml_post):
        """Get the current Bulk Resource URI."""
        xml_root = ET.fromstring(xml_post)
        return xml_root[0].text

    def get_espi_data(self, resource_uri, access_token):
        """Get the ESPI data from the API."""
        header_params = {'Authorization': f'Bearer {access_token}'}

        response = requests.get(
            resource_uri,
            data={},
            headers=header_params,
            cert=self.cert
        )
        if str(response.status_code) == "200":
            xml_data = response.content
            print(xml_data)
            return xml_data
        elif str(response.status_code) == "403":
            access_token = self.get_access_token()
            self.get_espi_data(resource_uri, access_token)
        print({"status": response.status_code,
               "error": response.text})


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
        if not self.path == '/pgesmd':
            return

        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()

        content_len = int(self.headers.get('Content-Length'))
        xml_post = self.rfile.read(content_len)
        catalog(xml_post, self.library)

        api = SelfAccessApi(client_id,
                            client_secret,
                            CERT_PATH,
                            KEY_PATH)

        resource_uri = api.get_resource_uri(xml_post)

        access_token = api.get_access_token()
        api.get_espi_data(resource_uri, access_token)


def run(api, server_class=HTTPServer):
    server_address = ('', PORT)
    httpd = server_class(server_address, handler)

    httpd.socket = ssl.wrap_socket(
        httpd.socket,
        certfile=CERT_PATH,
        keyfile=KEY_PATH,
        server_side=True)

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

    api = SelfAccessApi(client_id,
                        client_secret,
                        CERT_PATH,
                        KEY_PATH)

    access_token = api.get_access_token()

    request_post = api.async_request()
    if request_post:
        try:
            run(api)
        except KeyboardInterrupt:
            pass
