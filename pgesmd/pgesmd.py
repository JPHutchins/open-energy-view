import os
import sys
import logging

from pgesmd.api import SelfAccessApi
from pgesmd.server import SelfAccessServer
from pgesmd.helpers import get_auth_file

_LOGGER = logging.getLogger(__name__)

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
