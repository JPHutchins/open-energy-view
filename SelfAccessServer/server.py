from http.server import BaseHTTPRequestHandler, HTTPServer
import requests
import json
import ssl
import os
import xml.etree.ElementTree as ET
import logging
from base64 import b64encode

PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))

# Enter your Third Party ID as listed in the Share My Data portal.
THIRD_PARTY_ID = '50916'

# Update the files referenced below with your credentials.
CERT_PATH = f'{PROJECT_PATH}/cert/cert.crt'
KEY_PATH = f'{PROJECT_PATH}/cert/private.key'
AUTH_PATH = f'{PROJECT_PATH}/auth/auth.json'

# Port forwarding.  Forward external port 443 to this application:PORT.
PORT = 7999

# EmonCMS connection info.  https://github.com/emoncms
EMONCMS_IP = 'http://192.168.0.40:8080'
EMONCMS_WRITE_KEY = 'db4da6f33f8739ea50b0038d2fc96cec'
EMONCMS_NODE = 30

TOKEN_URL = 'https://api.pge.com/datacustodian/test/oauth/v2/token'
UTILITY_URI = 'https://api.pge.com'
API_URI = '/GreenButtonConnect/espi'
BULK_RESOURCE_URI =\
    f'{UTILITY_URI}{API_URI}/1_1/resource/Batch/Bulk/{THIRD_PARTY_ID}'

LOG_LEVEL = 'DEBUG'

logging.basicConfig(level=logging.DEBUG,
                    filename='log',
                    format='%(levelname)s - %(asctime)s - %(message)s')
_LOGGER = logging.getLogger('PGESMD Server')


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
        b64 = b64encode(
            f'{self.client_id}:{self.client_secret}'.encode('utf-8'))
        b64_string = bytes.decode(b64)
        self.auth_header = f'Basic {b64_string}'

        return self.auth_header

    def get_cert(self):
        """Return the tuple ([public certificate], [private key])"""
        if not self.cert[0]:
            _LOGGER.error(f'Missing certificate file (symlink): {CERT_PATH}')
            return None

        if not self.cert[1]:
            _LOGGER.error(f'Missing key file (symlink): {KEY_PATH}')
            return None

        return self.cert

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
            try:
                self.access_token = response.json()['client_access_token']
                return self.access_token
            except KeyError:
                _LOGGER.error('get_access_token failed.  Server JSON response'
                              'did not contain "client_access_token" key')

        _LOGGER.error(f'get_access_token failed.\n'
                      f'{response.status_code}: {response.text}')

    def async_request(self):
        """Return True upon successful asynchronous request."""
        header_params = {'Authorization': f'Bearer {self.access_token}'}

        _LOGGER.debug(f'Sending request to {BULK_RESOURCE_URI} using'
                      f'access_token {self.access_token}')

        response = requests.get(
            BULK_RESOURCE_URI,
            data={},
            headers=header_params,
            cert=self.cert
        )
        if str(response.status_code) == "202":
            _LOGGER.info('async_request successful,'
                         ' awaiting POST from server.')
            return True
        _LOGGER.error(f'async_request to Bulk Resource URI failed.\n'
                      f'{response.status_code}: {response.text}')
        return False

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
            return xml_data
        elif str(response.status_code) == "403":
            access_token = self.get_access_token()
            self.get_espi_data(resource_uri, access_token)
        _LOGGER.error(f'get_espi_data failed.  {resource_uri} responded: \n'
                      f'{response.status_code}: {response.text}')


def get_auth_file():
    """Try to open auth.json and return (client_id, client_secret)."""
    try:
        with open(AUTH_PATH) as auth:
            data = auth.read()
            json_data = json.loads(data)
            try:
                client_id = json_data["client_id"]
                client_secret = json_data["client_secret"]
                return (client_id, client_secret)
            except KeyError:
                _LOGGER.error("Auth file should be JSON with fields: \n"
                              "\"client_id\": and \"client_secret\":")
            return None
    except FileNotFoundError:
        _LOGGER.error(f"Auth file not found at {AUTH_PATH}.")
        return None


def get_emoncms_from_espi(xml_data):
    """Parse ESPI data for export to emonCMS."""
    root = ET.fromstring(xml_data)
    ns = {'espi': 'http://naesb.org/espi'}

    emoncms_data = []

    multiplier = pow(10,
                     int(root.find('.//espi:powerOfTenMultiplier', ns).text))

    date_start = int(
        root.find('.//espi:interval', ns).find('.//espi:start', ns).text)

    interval_block = root.find('.//espi:IntervalBlock', ns)
    for reading in interval_block.findall('.//espi:IntervalReading', ns):
        start = int(reading.find('.//espi:start', ns).text)
        value = int(reading.find('.//espi:value', ns).text)
        watt_hours = int(value * multiplier)
        offset = start - date_start

        emoncms_data.append([offset, EMONCMS_NODE, watt_hours])

    return (date_start, emoncms_data)


def post_data_to_emoncms(for_emoncms):
    """Send the bulk data to emonCMS."""
    date_start, emoncms_data = for_emoncms

    params = {'apikey': EMONCMS_WRITE_KEY,
              'time': date_start,
              'data': str(emoncms_data)}

    _LOGGER.debug(f'Sending to emoncms with params: {params}')

    response = requests.post(
        f'{EMONCMS_IP}/input/bulk',
        params=params)

    if response:
        if response.text == 'ok':
            _LOGGER.info('Data sent to emonCMS.')
            return True
        _LOGGER.error(f'emonCMS replied with: {response.text}')
        return False
    _LOGGER.error(f'No response from emonCMS at {EMONCMS_IP}/input/bulk')
    return False


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        if not self.path == '/pgesmd':
            return

        _LOGGER.info(f'Received POST from {self.address_string}')

        body = self.rfile.read(int(self.headers.getheader('Content-Length')))
        resource_uri = ET.fromstring(body)[0].text
        if not resource_uri[:len(UTILITY_URI)] == UTILITY_URI:
            _LOGGER.error(f'POST from {self.address_string} contains:\n'
                          f'{body}/n'
                          f'{resource_uri[:len(UTILITY_URI)]}'
                          f' != {UTILITY_URI}')
            return

        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()

        api = SelfAccessApi(client_id,
                            client_secret,
                            CERT_PATH,
                            KEY_PATH)

        access_token = api.get_access_token()
        xml_data = api.get_espi_data(resource_uri, access_token)
        for_emoncms = get_emoncms_from_espi(xml_data)
        post_data_to_emoncms(for_emoncms)
        return


def run(server_class=HTTPServer):
    server_address = ('', PORT)
    httpd = server_class(server_address, handler)

    httpd.socket = ssl.wrap_socket(
        httpd.socket,
        certfile=CERT_PATH,
        keyfile=KEY_PATH,
        server_side=True)

    httpd.serve_forever()


if __name__ == '__main__':

    client_id, client_secret = get_auth_file()
    _LOGGER.debug(f'Using auth.json:\n'
                  f'client_id: {client_id}\n'
                  f'client_secret: {client_secret}'
                  )

    api = SelfAccessApi(client_id,
                        client_secret,
                        CERT_PATH,
                        KEY_PATH)

    access_token = api.get_access_token()

    request_post = api.async_request()
    if request_post:
        try:
            run()
        except KeyboardInterrupt:
            pass
