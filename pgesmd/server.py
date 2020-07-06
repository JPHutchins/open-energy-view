"""A server that handles POST from PGE SMD servers."""

from http.server import BaseHTTPRequestHandler, HTTPServer
from xml.etree import cElementTree as ET
import ssl
import logging
import os

from pgesmd.helpers import parse_espi_data, get_bulk_id_from_xml
from pgesmd.database import EnergyHistory
# from . import db

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_LOGGER = logging.getLogger(__name__)


class PgePostHandler(BaseHTTPRequestHandler):
    """Handle POST from PGE."""

    api = None
    save_file = None
    filename = None
    to_db = None

    def do_POST(self):
        """Download the ESPI XML and save to database."""
        _LOGGER.debug(f'Received POST from {self.address_string()}')

        if self.path == '/test':
            self.send_response(200)
            self.end_headers()
            return

        if not self.path == '/pgesmd':
            return

        _LOGGER.info(f'Received POST from {self.address_string()}')

        body = self.rfile.read(int(self.headers.get('Content-Length')))
        _LOGGER.debug(body)
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

        if self.save_file:
            save_name = self.save_file(xml_data, filename=self.filename)
            if save_name:
                _LOGGER.info(f"XML saved at {save_name}")
            else:
                _LOGGER.error("File not saved.")

        if self.to_db:
            db = EnergyHistory(path='/test/data/energy_history_test.db')
            db.insert_espi_xml(xml_data, get_bulk_id_from_xml(xml_data))


class SelfAccessServer:
    """Server class for PGE SMD Self Access API."""

    def __init__(self,
                 api_instance,
                 save_file=None,
                 filename=None,
                 to_db=True,
                 close_after=False):
        """Initialize and start the server on construction."""
        PgePostHandler.api = api_instance
        PgePostHandler.save_file = save_file
        PgePostHandler.filename = filename
        PgePostHandler.to_db = to_db
        server = HTTPServer(('', 7999), PgePostHandler)

        server.socket = ssl.wrap_socket(
            server.socket,
            certfile=api_instance.cert[0],
            keyfile=api_instance.cert[1],
            server_side=True)

        if close_after:
            server.handle_request()
        else:
            server.serve_forever()
