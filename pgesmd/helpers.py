import json
import requests
import logging
from operator import itemgetter
from xml.etree import cElementTree as ET

_LOGGER = logging.getLogger(__name__)

EMONCMS_IP = 'http://192.168.0.40:8080'
EMONCMS_WRITE_KEY = 'db4da6f33f8739ea50b0038d2fc96cec'


def get_auth_file(auth_path):
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
    """Generator for iterating ESPI XML.

    Sequentially yields a tuple for each Interval Reading:
        (start, duration, value, watthours)
    """
    it = map(itemgetter(1), iter(ET.iterparse(xml_file)))

    for data in it:
        if data.tag == f'{ns}powerOfTenMultiplier':
            mp = int(data.text)
        if data.tag == f'{ns}IntervalBlock':
            # values = []
            for interval in data.findall(f'{ns}IntervalReading'):
                time_period = interval.find(f'{ns}timePeriod')

                duration = time_period.find(f'{ns}duration').text
                start = time_period.find(f'{ns}start').text
                value = int(interval.find(f'{ns}value').text)
                watt_h = int(value * pow(10, mp))

                # values.append((start, duration, value, watt_h))
                yield (start, duration, value, watt_h)
            # yield values
            data.clear()


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
