from http.server import BaseHTTPRequestHandler, HTTPServer
import sys
import requests
import json
import ssl
import os
import xml.etree.ElementTree as ET
import logging
import time
from base64 import b64encode

from pgesmd.helpers import (
    get_auth_file,
    get_emoncms_from_espi,
    post_data_to_emoncms)

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

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

TOKEN_URI = 'https://api.pge.com/datacustodian/oauth/v2/token'
UTILITY_URI = 'https://api.pge.com'
API_URI = '/GreenButtonConnect/espi'
BULK_RESOURCE_URI =\
    f'{UTILITY_URI}{API_URI}/1_1/resource/Batch/Bulk/{THIRD_PARTY_ID}'

logging.basicConfig(level=logging.DEBUG,
                    filename='log',
                    format='%(levelname)s - %(asctime)s - %(message)s')
_LOGGER = logging.getLogger('PGESMD Server')


class SelfAccessApi:
    """Representaiton of the PG&E SMD API for Self Access Users."""
    def __init__(self,
                 third_party_id,
                 client_id,
                 client_secret,
                 cert_crt_path,
                 cert_key_path,
                 token_uri=None,
                 utility_uri=None,
                 api_uri=None,
                 service_status_uri=None,
                 ):
        self.third_party_id = third_party_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.cert = (cert_crt_path, cert_key_path)
        self.access_token = None
        self.access_token_exp = 0

        if token_uri:
            self.token_uri = token_uri
        else:
            self.token_uri =\
                'https://api.pge.com/datacustodian/oauth/v2/token'

        if utility_uri:
            self.utility_uri = utility_uri
        else:
            self.utility_uri =\
                'https://api.pge.com'

        if api_uri:
            self.api_uri = api_uri
        else:
            self.api_uri =\
                '/GreenButtonConnect/espi'

        if service_status_uri:
            self.service_status_uri = service_status_uri
        else:
            self.service_status_uri = 'https://api.pge.com/GreenButtonConnect'
            '/espi/1_1/resource/ReadServiceStatus'

        self.bulk_resource_uri = (f'{self.utility_uri}{self.api_uri}'
                                  f'/1_1/resource/Batch/Bulk/'
                                  f'{self.third_party_id}')

        b64 = b64encode(
            f'{self.client_id}:{self.client_secret}'.encode('utf-8'))
        self.auth_header = f'Basic {bytes.decode(b64)}'

    def need_token(self):
        """Return True if the access token has expired, False otherwise."""
        if time.time() > self.access_token_exp - 5:
            return True
        return False

    def get_access_token(self):
        """Request and return access token from the PGE SMD Servers."""
        if not self.auth_header:
            _LOGGER.critical('Missing self.auth_header, RI violated.')

        if not self.cert[0] or not self.cert[1]:
            _LOGGER.critical('Missing self.cert, RI violated.')

        request_params = {'grant_type': 'client_credentials'}
        header_params = {'Authorization': self.auth_header}

        response = requests.post(
            self.token_uri,
            data=request_params,
            headers=header_params,
            cert=self.cert)

        if str(response.status_code) == "200":
            try:
                content = json.loads(response.text)
                self.access_token = content['client_access_token']
                self.access_token_exp = time.time() + int(
                    content['expires_in'])
                return self.access_token
            except KeyError:
                _LOGGER.error('get_access_token failed.  Server JSON response'
                              'did not contain "client_access_token" key')
                return None

        _LOGGER.error(f'get_access_token failed.  |  '
                      f'{response.status_code}: {response.text}')
        return None

    def async_request(self):
        """Return True upon successful asynchronous request."""
        if self.need_token():
            self.get_access_token()

        header_params = {'Authorization': f'Bearer {self.access_token}'}

        _LOGGER.debug(f'Sending request to {self.bulk_resource_uri} using'
                      f'access_token {self.access_token}')

        response = requests.get(
            self.bulk_resource_uri,
            data={},
            headers=header_params,
            cert=self.cert
        )
        if str(response.status_code) == "202":
            _LOGGER.info('async_request successful,'
                         ' awaiting POST from server.')
            return True
        _LOGGER.error(f'async_request to Bulk Resource URI failed.  |  '
                      f'{response.status_code}: {response.text}')
        return False

    def get_espi_data(self, resource_uri, retried=False):
        """Get the ESPI data from the API."""
        if self.need_token():
            self.get_access_token()

        header_params = {'Authorization': f'Bearer {self.access_token}'}

        response = requests.get(
            resource_uri,
            data={},
            headers=header_params,
            cert=self.cert
        )
        if str(response.status_code) == "200":
            xml_data = response.content
            return xml_data
        elif str(response.status_code) == "403" and not retried:
            _LOGGER.error(f'get_espi_data failed. Refreshing token.'
                          f'{resource_uri} responded: '
                          f'{response.status_code}: {response.text}')
            if self.get_access_token():
                self.get_espi_data(resource_uri, retried=True)
        elif str(response.status_code) == "403":
            _LOGGER.error(f'get_espi_data failed. Check auth file.'
                          f'{resource_uri} responded: '
                          f'{response.status_code}: {response.text}')
            return None
        _LOGGER.error(f'get_espi_data failed.  {resource_uri} responded: '
                      f'{response.status_code}: {response.text}')


class PgeRegister:
    """Complete the PGE Share My Data API Connectivity Tests.

    Keyword argument:
        method -- a function that returns the tuple:
            ([Third Party ID] string - use "" if unknown,
             [Client ID] string,
             [Client Secret] string,
             [Full path to certificate] string,
             [Full path to private key] string)
             Default is get_auth_file() which will look in ./auth/auth.json
    """
    # refer to: https://www.pge.com/en_US/residential/save-energy-money/analyze-your-usage/your-usage/view-and-share-your-data-with-smartmeter/reading-the-smartmeter/share-your-data/third-party-companies/testing-details.page

    def __init__(self,
                 method=get_auth_file,
                 auth_path=f'{PROJECT_PATH}/auth/auth.json'):
        self.auth = method(auth_path)

        self._api = SelfAccessApi(*self.auth)
        self.access_token = None
        self.testing_completed = False

    def get_credentials(self):
        """Backup CLI method to retrieve credentials from user."""
        return ("",
                input("Client ID: "),
                input("Client Secret: "),
                input("Full path to SSL certificate file (cert, crt): "),
                input("Full path to SSL private key file (private, key): ")
                )

    def get_access_token(self):
        """Get the access token from the PGE API.

        Keyword argument:
        method -- a function that returns the tuple:
            ([Third Party ID] string - use "" if unknown,
             [Client ID] string,
             [Client Secret] string,
             [Full path to certificate] string,
             [Full path to private key] string)
             Default is get_auth_file() which will look in ./auth/auth.json
        """

        self._api.token_uri = 'https://api.pge.com/datacustodian'
        '/test/oauth/v2/token'

        print(f"Requesting client access token from {self._api.token_uri}")
        self.access_token = self._api.get_access_token()
        if self.access_token:
            print(f"Access token received: {self.access_token}")
            return
        print("Request failed, see log.")

    def get_service_status(self):
        print(f"Requesting service status from {self._api.service_status_uri}")

        header_params = {'Authorization': f'Bearer {self.access_token}'}
        response = requests.get(
            self._api.service_status_uri,
            headers=header_params,
            cert=self._api.cert
        )
        if not response:
            print(f"No response from {self._api.service_status_uri}")
            return False
        if not str(response.status_code) == '200':
            print(f"Error: {response.status_code}, {response.text}")
            return False
        try:
            root = ET.fromstring(response.text)
            if root[0].text == '1':
                print('Service status is online.')
                return True
            print('Service status is offline.')
            return False
        except ET.ParseError:
            print(f"Could not parse XML: {response.text}")
            return False

    def get_sample_data(self):
        _uri = 'https://api.pge.com/GreenButtonConnect'
        '/espi/1_1/resource/DownloadSampleData'

        print(f"Requesting sample data from {_uri}")

        header_params = {'Authorization': f'Bearer {self.access_token}'}
        response = requests.get(
            _uri,
            headers=header_params,
            cert=self._api.cert
        )
        if not response:
            print(f"No response from {_uri}")
            return False
        if not str(response.status_code) == '200':
            print(f"Error: {response.status_code}, {response.text}")
            return False
        self.testing_completed = True
        return True
        # MAYBE parse this before returning True in future... maybe

    def get_third_party_id(self):
        print("Requesting Third Party ID {BulkID}.")

        header_params = {'Authorization': f'Bearer {self.access_token}'}
        response = requests.get(
            'https://api.pge.com/GreenButtonConnect/espi/1_1'
            '/resource/Authorization',
            headers=header_params,
            cert=self._api.cert)

        if not response:
            print("No response from server.")
        if not str(response.status_code) == '200':
            print(f"Error: {response.status_code}, {response.text}")
            return ""

        def search_xml_for_id(root, tag, text, n, result):
            for child in root:
                if child.tag == tag:
                    if child.text[:n] == text:
                        result = child.text[n:]
                        break
                result = search_xml_for_id(child, tag, text, n, result)
            return result

        root = ET.fromstring(response.text)
        tag = '{http://naesb.org/espi}resourceURI'
        text = 'https://api.pge.com/GreenButtonConnect'
        '/espi/1_1/resource/Batch/Bulk/'
        return search_xml_for_id(root,
                                 tag,
                                 text,
                                 len(text),
                                 None)


class PgePostHandler(BaseHTTPRequestHandler):
    api = None

    def do_POST(self):
        if not self.path == '/pgesmd':
            return

        _LOGGER.info(f'Received POST from {self.address_string()}')

        body = self.rfile.read(int(self.headers.get('Content-Length')))
        try:
            resource_uri = ET.fromstring(body)[0].text
        except ET.ParseError:
            _LOGGER.error(f'Could not parse message: {body}')
            return
        if not resource_uri[:len(self.api.utility_uri)] ==\
                self.api.utility_uri:
            _LOGGER.error(f'POST from {self.address_string} contains: '
                          f'{body}     '
                          f'{resource_uri[:len(self.api.utility_uri)]}'
                          f' != {self.api.utility_uri}')
            return

        self.send_response(200)
        self.end_headers()

        xml_data = self.api.get_espi_data(resource_uri)
        for_emoncms = get_emoncms_from_espi(xml_data)
        post_data_to_emoncms(for_emoncms)
        return


class SelfAccessServer:
    def __init__(self, api_instance):
        PgePostHandler.api = api_instance
        server = HTTPServer(('', PORT), PgePostHandler)

        server.socket = ssl.wrap_socket(
            server.socket,
            certfile=api_instance.cert[0],
            keyfile=api_instance.cert[1],
            server_side=True)

        server.serve_forever()


if __name__ == '__main__':

    auth_path = f'{PROJECT_PATH}/auth/auth.json'
    auth = get_auth_file(auth_path)

    if not auth:
        # handle missing auth file
        print(f"Missing auth file at {auth_path}")
        sys.exit()

    _LOGGER.debug(f'Using auth.json:  '
                  f'third_party_id: {auth[0]}, '
                  f'client_id: {auth[1]}, '
                  f'client_secret: {auth[2]}, '
                  f'cert_crt_path: {auth[3]}, '
                  f'cert_key_path: {auth[4]}'
                  )

    api = SelfAccessApi(*auth)

    access_token = api.get_access_token()

    request_post = api.async_request()
    if request_post:
        try:
            server = SelfAccessServer(api)
        except KeyboardInterrupt:
            pass
