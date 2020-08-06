from base64 import b64encode
from time import time
import requests
import json
from xml.etree import cElementTree as ET
import re


from . import models
from . import db
from .espi_helpers import insert_espi_xml_into_db, save_espi_xml
from .helpers import request_url


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
        self.bulk_id = bulk_id
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

    def get_client_id_headers(self):
        return {"Authorization": self.auth_header}

    def need_client_access_token(self):
        """Return True if the access token has expired, False otherwise."""
        if time() > self.client_access_token_exp - 5:
            return True
        return False

    def get_client_access_token(self):
        params = {"grant_type": "client_credentials"}
        headers = {"Authorization": self.auth_header}

        response = requests.post(
            self.token_uri, params=params, headers=headers, cert=self.cert
        )

        if str(response.status_code) == "200":
            try:
                content = json.loads(response.text)
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

    def get_client_access_token_headers(self):
        if self.need_client_access_token():
            self.get_client_access_token()
        return {"Authorization": f"Bearer {self.client_access_token}"}

    def get_service_status(self):
        """Return True if utility responds with status online, False otherwise."""
        root = request_url(
            "GET",
            self.service_status_uri,
            headers=self.get_client_access_token_headers(),
            cert=self.cert,
            format="xml",
        )
        if root[0].text == "1":
            print("Service status is online.")
            return True
        print("Service status is offline.")
        return False

    def get_published_period_start(self, authorization_uri):
        """Return the published period start if found, else None."""
        root = request_url(
            "GET",
            authorization_uri,
            headers=self.get_client_access_token_headers(),
            cert=self.cert,
            format="xml",
        )
        published_period_start = None
        for item in root.iter("{http://naesb.org/espi}publishedPeriod"):
            published_period_start = item.find("{http://naesb.org/espi}start").text
        return published_period_start

    def need_access_token(self, source):
        """Paramater source is SQL object."""
        return source.token_exp < time() - 5

    def refresh_access_token(self, source):
        params = {
            "grant_type": "refresh_token",
            "refresh_token": source.refresh_token,
        }
        response_text = request_url(
            "POST",
            self.source_refresh_token_uri,
            params=params,
            headers=self.get_client_id_headers,
            cert=self.cert,
            format="text",
        )
        response_json = json.loads(response_text)
        source_row = db.session.query(models.Source).filter_by(id=source.id).first()
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
        return response_json.get("access_token")

    def get_access_token_headers(self, source):
        if self.need_access_token(source):
            access_token = self.refresh_access_token(source)
        else:
            access_token = source.access_token
        return {"Authorization": f"Bearer {access_token}"}

    def get_usage_points(self, subscription_id, access_token):
        """Return a dictionary of usage points keyed by type
           ex. {"electricity": ["integer string"]}."""
        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{self.api_uri}/espi/1_1/resource/Subscription/{subscription_id}/UsagePoint"
        root = request_url("GET", url, headers=headers, cert=self.cert, format="xml")
        ns0 = "{http://naesb.org/espi}"
        ns1 = "{http://www.w3.org/2005/Atom}"
        re_usage_point = r"(?<=UsagePoint\/)\d+"
        usage_points = {}
        for child in root.iter(f"{ns1}entry"):
            cur_usage_point = None
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

    def get_meter_reading(self, source, start=None, end=None):
        url = (
            f"{self.api_uri}"
            f"/espi/1_1/resource/Subscription/{source.subscription_id}"
            f"/UsagePoint/{source.usage_point}/MeterReading"
        )
        root = request_url(
            "GET",
            url,
            headers=self.get_access_token_headers(),
            cert=self.cert,
            format="xml",
        )
        ns1 = "{http://www.w3.org/2005/Atom}"
        urls = []
        for child in root:
            if child.tag == f"{ns1}entry":
                for item in child:
                    url = item.attrib.get("href") or ""
                    if url:
                        urls.append(url)
        re_interval_block_url = r"https:\/\/api\.pge\.com.*IntervalBlock"
        for url in urls:
            response_text = request_url(
                "GET",
                url,
                headers=self.get_access_token_headers(),
                cert=self.cert,
                format="text",
            )
            group = re.search(re_interval_block_url, response_text)
            if not group:
                continue

            interval_block_url = group[0]
            params = (
                {"published-min": start, "published-max": end or int(time())}
                if start
                else None
            )
            response_text = request_url(
                "GET",
                interval_block_url,
                params=params,
                headers=self.get_access_token_headers(),
                cert=self.cert,
                format="text",
            )
            xml = response_text
            insert_espi_xml_into_db(xml, source.id)
            break
        return {}, 200

    def request_bulk_data(self):
        url = f"{self.api_uri}/espi/1_1/resource/Batch/Bulk/{self.bulk_id}"
        response = requests.get(
            url, headers=self.get_client_access_token_headers(), cert=self.cert
        )
        if str(response.status_code) == "202":
            print("request successful," " awaiting POST from server.")
            return True
        print(
            f"request to Bulk Resource URI failed.  |  "
            f"{response.status_code}: {response.text}"
        )
        return False

    def get_daily_deltas(self, resource_uris, save=False):
        for url in resource_uris:
            response = request_url(
                "GET",
                url,
                headers=self.get_client_access_token_headers(),
                cert=self.cert,
            )
            if not response:
                print(f"No response from {url}")
                continue
            if not str(response.status_code) == "200":
                print(f"Error: {response.status_code}, {response.text}")
                continue

            xml = response.text
            root = ET.fromstring(xml)
            usage_point = None
            for item in root.iter():
                href = item.attrib.get("href")
                if not href:
                    continue
                if group := re.search(r"(?<=UsagePoint/)\d+", href):
                    usage_point = group[0]
                    break
            if not usage_point:
                print("could not find usage point in xml, saving")
                save_espi_xml(xml)
                break

            # TODO: add check for utility name and/or subscription_id and use in filter
            sources = db.session.query(models.Source).filter_by(usage_point=usage_point)
            sources_count = sources.count()
            if sources_count == 0:
                print(f"could not find usage point {usage_point} in db, probably gas")
                break
            elif sources_count > 1:
                print(f"WARNING: {usage_point} is associated with multiple sources")

            for source in sources:
                insert_espi_xml_into_db(xml, source.id, save=save)


class Pge(Api):
    """Pge client API."""

    def get_historical_data_incrementally(self, source):
        """Get all interval data 28 days at a time according to PG&E guidelines."""
        if self.need_access_token(source):
            self.refresh_access_token(source)
        headers = {"Authorization": f"Bearer {source.access_token}"}
        url = (
            f"{self.api_uri}"
            f"/espi/1_1/resource/Subscription/{source.subscription_id}"
            f"/UsagePoint/{source.usage_point}/MeterReading"
        )
        response_text = request_url(
            "GET", url, headers=headers, cert=self.cert, format="text"
        )
        group = re.search(r"https:\/\/api\.pge\.com.*IntervalBlock", response_text)
        if group:
            interval_block_url = group[0]
        else:
            print("Could not find interval block url")
            return {"error": "could not find interval block url"}, 500

        four_weeks = 3600 * 24 * 28
        end = int(time())
        while end > source.published_period_start:
            start = end - four_weeks + 3600
            params = {
                "published-min": start,
                "published-max": end,
            }
            response_text = request_url(
                "GET",
                interval_block_url,
                params=params,
                headers=headers,
                cert=self.cert,
                format="text",
            )
            insert_espi_xml_into_db(response_text, source.id)
            end = start - 3600
        return
