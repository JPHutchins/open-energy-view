"""Helper functinos for pgesmd."""

import json
import os
import requests
import logging
import time
from datetime import datetime
from operator import itemgetter
from xml.etree import cElementTree as ET

_LOGGER = logging.getLogger(__name__)

EMONCMS_IP = 'http://192.168.0.40:8080'
EMONCMS_WRITE_KEY = 'db4da6f33f8739ea50b0038d2fc96cec'
PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Crosses:
    """Test whether or not a number has been crossed from the 'left' side."""

    def __init__(self, target):
        """Initialize."""
        self.target = target
        self.lessthan = False

    def test(self, value):
        """Return True if value has crossed the target, otherwise False."""
        if value == self.target:
            return True
        elif value >= self.target and self.lessthan:
            return True
        elif value < self.target:
            self.lessthan = True
            return False
        return False


def get_auth_file(auth_path=f'{PROJECT_PATH}/auth/auth.json'):
    """Try to open auth.json and return tuple."""
    try:
        with open(auth_path) as auth:
            data = auth.read()
            json_data = json.loads(data)
            try:
                third_party_id = json_data["third_party_id"]
                client_id = json_data["client_id"]
                client_secret = json_data["client_secret"]
                cert_crt_path = json_data["cert_crt_path"]
                cert_key_path = json_data["cert_key_path"]
                return (third_party_id,
                        client_id,
                        client_secret,
                        cert_crt_path,
                        cert_key_path)
            except KeyError:
                _LOGGER.error("Auth file should be JSON with keys: "
                              "\"third_party_id\": and \"client_id\": and "
                              "\"client_secret\": and \"cert_crt_path\": and "
                              "\"cert_key_path\": ")
            return None
    except FileNotFoundError:
        _LOGGER.error(f"Auth file not found at {auth_path}.")
        return None


def parse_espi_data(xml_file, ns='{http://naesb.org/espi}'):
    """Generate ESPI tuple from ESPI XML.

    Sequentially yields a tuple for each Interval Reading:
        (start, duration, value, watthours, date)

    The transition from Daylight Savings Time to Daylight Standard
    Time or inverse are ignored as follows:
    - If the "clocks are set back" then a UTC data point is repeated.  The
        repetition is ignored in order to maintain 24 hours per day.
    - If the "clocks are set forward" then a UTC data point is missing.  The
        missing hour is filled with the average of the previous and following
        values in order to maintain 24 hours per day.
    """
    _LOGGER.debug(f"Trying to parse {xml_file}.")

    # Find initial values
    tree = ET.parse(xml_file)
    root = tree.getroot()
    for child in root.iter(f'{ns}timePeriod'):
        first_start = int(child.find(f'{ns}start').text)
        duration = int(child.find(f'{ns}duration').text)
        break
    previous = (first_start - duration, 0, 0, 0, 0)
    root.clear()

    # Find all values
    it = map(itemgetter(1), iter(ET.iterparse(xml_file)))
    for data in it:
        if data.tag == f'{ns}powerOfTenMultiplier':
            mp = int(data.text)
        if data.tag == f'{ns}IntervalBlock':
            for interval in data.findall(f'{ns}IntervalReading'):
                time_period = interval.find(f'{ns}timePeriod')

                duration = int(time_period.find(f'{ns}duration').text)
                start = int(time_period.find(f'{ns}start').text)
                value = int(interval.find(f'{ns}value').text)
                watt_hours = int(round(value * pow(10, mp) * duration / 3600))
                date = datetime.fromtimestamp(start).strftime('%Y-%m-%d')

                if start == previous[0]:  # clocks back
                    continue

                if not start == previous[0] + duration:  # clocks forward
                    start = previous[0] + duration
                    value = int((previous[2] + value) / 2)
                    watt_hours = int(round(value * pow(10, mp)))
                    previous = (start, duration, value, watt_hours)
                    yield (start, duration, value, watt_hours, date)
                    continue

                previous = (start, duration, value, watt_hours, date)
                yield (start, duration, value, watt_hours, date)

            data.clear()


def save_espi_xml(xml_data):
    """Save ESPI XML to a file named by timestamp."""
    timestamp = time.strftime('%y.%m.%d %H:%M:%S', time.localtime())
    filename = f'{PROJECT_PATH}/data/espi_xml/{timestamp}.xml'
    with open(filename, 'w') as file:
        file.write(xml_data)
    return filename


def get_emoncms_from_espi(xml_data,
                          emoncms_node=30):
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

        emoncms_data.append([offset, emoncms_node, watt_hours])

    return (date_start, emoncms_data)


def post_data_to_emoncms(for_emoncms,
                         emoncms_ip='http://192.168.0.40:8080',
                         emoncms_write_key='db4da6f33f8739ea50b0038d2fc96cec'):
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
