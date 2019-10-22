from http.server import BaseHTTPRequestHandler, HTTPServer
from xml.etree import cElementTree as ET
import ssl
import logging
import os

from pgesmd.helpers import (
    save_espi_xml,
    parse_espi_data
)

from pgesmd.database import EnergyHistory

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_LOGGER = logging.getLogger(__name__)


class PgePostHandler(BaseHTTPRequestHandler):
    api = None
    callback = None

    def do_POST(self):
        """Download the ESPI XML and save to database."""
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
        filename = self.callback(xml_data)

        db = EnergyHistory()
        for entry in parse_espi_data(filename):
            db.add_espi_to_table(entry)
        return


class SelfAccessServer:
    def __init__(self, api_instance, callback=save_espi_xml):
        PgePostHandler.api = api_instance
        PgePostHandler.callback = callback
        server = HTTPServer(('', 7999), PgePostHandler)

        server.socket = ssl.wrap_socket(
            server.socket,
            certfile=api_instance.cert[0],
            keyfile=api_instance.cert[1],
            server_side=True)

        server.serve_forever()
