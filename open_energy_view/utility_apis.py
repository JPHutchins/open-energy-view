from base64 import b64encode
from time import time
import requests
import json
import xml.etree.ElementTree as ET
import re
from io import StringIO
from datetime import datetime
from operator import itemgetter
from sqlalchemy import exc
import os


from . import models
from . import db


def parse_espi_data(xml, ns="{http://naesb.org/espi}"):
    """Generate ESPI tuple from ESPI XML.
    Sequentially yields a tuple for each Interval Reading:
        (start, duration, watthours)
    The transition from Daylight Savings Time to Daylight Standard
    Time or inverse are ignored as follows:
    - If the "clocks are set back" then a UTC data point is repeated.  The
        repetition is ignored in order to maintain 24 hours per day.
    - If the "clocks are set forward" then a UTC data point is missing.  The
        missing hour is filled with the average of the previous and following
        values in order to maintain 24 hours per day.
    """
    print(f"Parsing the XML.")

    # Find initial values
    root = ET.fromstring(xml)
    for child in root.iter(f"{ns}timePeriod"):
        first_start = int(child.find(f"{ns}start").text)
        duration = int(child.find(f"{ns}duration").text)
        break
    previous = (first_start - duration, 0, 0)
    root.clear()

    xml = StringIO(xml)
    mp = -3

    # Find all values
    it = map(itemgetter(1), iter(ET.iterparse(xml)))
    for data in it:
        if data.tag == f"{ns}powerOfTenMultiplier":
            mp = int(data.text)
        if data.tag == f"{ns}IntervalBlock":
            for interval in data.findall(f"{ns}IntervalReading"):
                time_period = interval.find(f"{ns}timePeriod")

                duration = int(time_period.find(f"{ns}duration").text)
                start = int(time_period.find(f"{ns}start").text)
                value = int(interval.find(f"{ns}value").text)
                watt_hours = int(round(value * pow(10, mp) * duration / 3600))

                if start == previous[0]:  # clocks back
                    continue

                if not start == previous[0] + duration:  # clocks forward
                    start = previous[0] + duration
                    watt_hours = int((previous[2] + watt_hours) / 2)
                    previous = (start, duration, watt_hours)
                    yield (start, duration, watt_hours)
                    continue

                previous = (start, duration, watt_hours)
                yield (start, duration, watt_hours)

            data.clear()

def save_espi_xml(xml_data, filename=None):
    """Save ESPI XML to a file named by timestamp or filename key."""
    if filename:
        save_name = f"{os.getcwd()}/data/espi_xml/{filename}.xml"
    else:
        save_name = f"{os.getcwd()}/{time()}.xml"
    
    print(save_name)

    with open(save_name, "w") as file:
        file.write(xml_data)
    return save_name

def request_url(method, url, data=None, headers=None, cert=None, format=None):
    response = requests.request(method, url, data=data, headers=headers, cert=cert)
    if not response:
        print(f"No response from {self.source_refresh_token_uri}")
        return False
    if not str(response.status_code) == "200":
        print(f"Error: {response.status_code}, {response.text}")
        return False
    if format == "xml":
        try:
            root = ET.fromstring(response.text)
            return root
        except ET.ParseError:
            print(f"Could not parse XML: {response.text}")
            return False
    else:
        return response.text


class Api:
    def __init__(
        self,
        bulk_id,
        client_id,
        client_secret,
        registration_access_token,
        cert_path,
        key_path,
        token_uri,
        source_refresh_token_uri,
        utility_uri,
        api_uri,
        service_status_uri,
    ):
        self.bulk_id = bulk_id,
        self.client_id = client_id
        self.client_secret = client_secret
        self.registration_access_token = registration_access_token
        self.cert = (cert_path, key_path)
        self.token_uri = token_uri
        self.source_refresh_token_uri = source_refresh_token_uri
        self.utility_uri = utility_uri
        self.api_uri = api_uri
        self.service_status_uri = service_status_uri
        self.client_access_token = None
        self.client_access_token_exp = 0
        self.refresh_token = None
        self.refresh_token_exp = 0

        b64 = b64encode(f"{self.client_id}:{self.client_secret}".encode("utf-8"))
        self.auth_header = f"Basic {bytes.decode(b64)}"

    def need_client_access_token(self):
        """Return True if the access token has expired, False otherwise."""
        if time() > self.client_access_token_exp - 5:
            return True
        return False


    def get_client_access_token(self):
        request_params = {"grant_type": "client_credentials"}
        header_params = {"Authorization": self.auth_header}

        response = requests.post(
            self.token_uri, data=request_params, headers=header_params, cert=self.cert
        )

        if str(response.status_code) == "200":
            try:
                content = json.loads(response.text)
                print(content)
                self.client_access_token = content["client_access_token"]
                self.client_access_token_exp = time() + int(content["expires_in"])
                return self.client_access_token
            except KeyError:
                print(
                    "get_client_access_token failed.  Server JSON response"
                    'did not contain "client_access_token" key'
                )
                return None

        return None

    def get_service_status(self):
        """Return True if utility responds with status online, False otherwise."""
        if self.need_client_access_token():
            self.get_client_access_token()
        # print(f"Requesting service status from {self.service_status_uri}")

        header_params = {"Authorization": f"Bearer {self.client_access_token}"}
        response = requests.get(
            self.service_status_uri, headers=header_params, cert=self.cert
        )
        root = request_url(
            "GET",
            self.service_status_uri,
            headers=header_params,
            cert=self.cert,
            format="xml",
        )
        if root[0].text == "1":
            print("Service status is online.")
            return True
        print("Service status is offline.")
        return False
       

    def get_published_period_start(self, authorization_uri):
        if self.need_client_access_token():
            self.get_client_access_token()

        header_params = {"Authorization": f"Bearer {self.client_access_token}"}
        response = requests.get(
            authorization_uri, headers=header_params, cert=self.cert
        )
        if not response:
            print(f"No response from {authorization_uri}")
            return
        if not str(response.status_code) == "200":
            print(f"Error: {response.status_code}, {response.text}")
            return
        try:
            root = ET.fromstring(response.text)
        except ET.ParseError:
            print(f"Could not parse XML: {response.text}")
            return

        def search_xml_for_start(root, publishedPeriod, start, result):
            for child in root:
                if child.tag == publishedPeriod:
                    for g_child in child:
                        if g_child.tag == start:
                            result = g_child.text
                result = search_xml_for_start(child, publishedPeriod, start, result)
            return result

        publishedPeriod = "{http://naesb.org/espi}publishedPeriod"
        start = "{http://naesb.org/espi}start"
        result = search_xml_for_start(root, publishedPeriod, start, None)
        return result

    def need_access_token(self, source):
        """Paramater source is SQL object."""
        return source.token_exp < time() - 5
    
    def get_access_token(self, source):
        if self.need_client_access_token:
            self.get_client_access_token
        

    def refresh_access_token(self, source):
        header_params = {"Authorization": self.auth_header}
        request_params = {
            "grant_type": "refresh_token",
            "refresh_token": source.refresh_token,
        }
        response = requests.post(
            self.source_refresh_token_uri,
            data=request_params,
            headers=header_params,
            cert=self.cert,
        )
        if not str(response.status_code) == "200":
            print(f"Error: {response.status_code}, {response.text}")
            return False
        response_json = json.loads(response.text)

        source_row = db.session.query(models.Source).filter_by(id=source.id)
        source_row.update(
            {
                "access_token": response_json.get("access_token"),
                "refresh_token": response_json.get("refresh_token"),
                "token_exp": int(response_json.get("expires_in")) + time(),
            }
        )
        try:
            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()
            return False
        return True

    def get_usage_points(self, subscription_id, access_token):
        header_params = {"Authorization": f"Bearer {access_token}"}
        url = f"{self.api_uri}/espi/1_1/resource/Subscription/{subscription_id}/UsagePoint"
        response = requests.get(url, headers=header_params, cert=self.cert,)
        if not response:
            print(f"No response from {url}")
            return False
        if not str(response.status_code) == "200":
            print(f"Error: {response.status_code}, {response.text}")
            return False
        try:
            root = ET.fromstring(response.text)
        except ET.ParseError:
            print(f"Could not parse XML: {response.text}")
            return
        ns0 = "{http://naesb.org/espi}"
        ns1 = "{http://www.w3.org/2005/Atom}"

        re_usage_point = r"(?<=UsagePoint\/)\d+"
        node = root
        usage_points = {}
        for child in root:
            cur_usage_point = None
            if child.tag == f"{ns1}entry":
                for item in child:
                    url = item.attrib.get("href") or ""
                    if group := re.search(re_usage_point, url):
                        cur_usage_point = group[0]
                        break
            if cur_usage_point:
                kind = child.find(
                    f"./{ns1}content/{ns0}UsagePoint/{ns0}ServiceCategory/{ns0}kind"
                )
                key = (
                    "electricity"
                    if kind.text == "0"
                    else "gas"
                    if kind.text == "1"
                    else "unknown"
                )
                if usage_points.get(key):
                    usage_points[key].append(cur_usage_point)
                else:
                    usage_points[key] = [cur_usage_point]
        return usage_points

    def get_meter_reading(self, source):
        if self.need_access_token(source):
            self.refresh_access_token(source)
        header_params = {"Authorization": f"Bearer {source.access_token}"}
        url = f"{self.api_uri}/espi/1_1/resource/Subscription/{source.subscription_id}/UsagePoint/{source.usage_point}/MeterReading"
        response = requests.get(url, headers=header_params, cert=self.cert,)
        if not response:
            print(f"No response from {url}")
            return False
        if not str(response.status_code) == "200":
            print(f"Error: {response.status_code}, {response.text}")
            return False
        try:
            root = ET.fromstring(response.text)
        except ET.ParseError:
            print(f"Could not parse XML: {response.text}")
            return
        ns1 = "{http://www.w3.org/2005/Atom}"
        urls = []
        for child in root:
            cur_usage_point = None
            if child.tag == f"{ns1}entry":
                for item in child:
                    url = item.attrib.get("href") or ""
                    if url:
                        urls.append(url)
        re_interval_block_url = r"https:\/\/api\.pge\.com.*IntervalBlock"
        for url in urls:
            response = requests.get(url, headers=header_params, cert=self.cert,)
            if not response:
                print(f"No response from {url}")
                break
            if not str(response.status_code) == "200":
                print(f"Error: {response.status_code}, {response.text}")
                break
            try:
                root = ET.fromstring(response.text)
            except ET.ParseError:
                print(f"Could not parse XML: {response.text}")
                break
            group = re.search(re_interval_block_url, response.text)
            if group:
                interval_block_url = group[0]
                header_params = {"Authorization": f"Bearer {source.access_token}"}
                request_params = {
                    "published-min": source.published_period_start,
                    "published-max": 1596178800 - 31536000,
                }
                response = requests.get(
                    interval_block_url,
                    params=request_params,
                    headers=header_params,
                    cert=self.cert,
                )
                if not response:
                    print(f"No response from {url}")
                    return
                if not str(response.status_code) == "200":
                    print(f"Error: {response.status_code}, {response.text}")
                    return
                xml = response.text
                save_espi_xml(xml)
                source_id = source.id
                print("going for parse...")
                data_update = []
                last_entry = ""
                for entry in parse_espi_data(xml):
                    data_update.append(
                        {
                            "source_id": source_id,
                            "start": entry[0],
                            "duration": entry[1],
                            "watt_hours": entry[2],
                        }
                    )
                    last_entry = entry[0]
                try:
                    db.session.bulk_insert_mappings(models.Espi, data_update)
                    db.session.commit()
                except exc.IntegrityError:
                    db.session.rollback()
                    db.engine.execute(
                        "INSERT OR IGNORE INTO espi (source_id, start, duration, watt_hours) VALUES (:source_id, :start, :duration, :watt_hours)",
                        data_update,
                    )
                finally:
                    timestamp = int(time() * 1000)
                    source_row = db.session.query(models.Source).filter_by(id=source_id)
                    source_row.update({"last_update": timestamp})
                    db.session.commit()
                break
        return {}, 200

    def get_espi_data(self, source):
        if self.need_access_token(source):
            self.refresh_access_token(source)

        header_params = {"Authorization": f"Bearer {source.access_token}"}
        request_params = {
            "published-min": source.published_period_start,
            "published-max": 1596178800 - 86400,
        }
        url = f"{self.api_uri}/espi/1_1/resource/Subscription/{source.subscription_id}/UsagePoint/{source.usage_point}/MeterReading"
        response = requests.get(
            url,
            headers=header_params,
            params=request_params,
            cert=self.cert,
        )
        if str(response.status_code) == "202":
            print("request successful," " awaiting POST from server.")
            return True
        print(
            f"request to Bulk Resource URI failed.  |  "
            f"{response.status_code}: {response.text}"
        )
        return False


class Pge(Api):
    """Pge client API."""

    pass
