from http.server import BaseHTTPRequestHandler, HTTPServer
from xml.etree import cElementTree as ET
import ssl
import logging

from pgesmd.helpers import (
    get_emoncms_from_espi,
    post_data_to_emoncms
    )

_LOGGER = logging.getLogger(__name__)


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
        server = HTTPServer(('', 7999), PgePostHandler)

        server.socket = ssl.wrap_socket(
            server.socket,
            certfile=api_instance.cert[0],
            keyfile=api_instance.cert[1],
            server_side=True)

        server.serve_forever()
