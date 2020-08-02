from base64 import b64encode
import time
import requests
import json
import xml.etree.ElementTree as ET


class Api:
    def __init__(
        self,
        client_id,
        client_secret,
        registration_access_token,
        cert_path,
        key_path,
        token_uri,
        utility_uri,
        api_uri,
        service_status_uri,
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.registration_access_token = registration_access_token
        self.cert = (cert_path, key_path)
        self.token_uri = token_uri
        self.utility_uri = utility_uri
        self.api_uri = api_uri
        self.service_status_uri = service_status_uri
        self.client_access_token = None
        self.client_access_token_exp = 0
        self.refresh_token = None
        self.refresh_token_exp = 0

        b64 = b64encode(f"{self.client_id}:{self.client_secret}".encode("utf-8"))
        self.auth_header = f"Basic {bytes.decode(b64)}"

    def need_token(self):
        """Return True if the access token has expired, False otherwise."""
        if time.time() > self.client_access_token_exp - 5:
            return True
        return False

    def get_token(self):
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
                self.client_access_token_exp = time.time() + int(content["expires_in"])
                return self.client_access_token
            except KeyError:
                print(
                    "get_token failed.  Server JSON response"
                    'did not contain "client_access_token" key'
                )
                return None

        return None

    def get_service_status(self):
        """Return True if utility responds with status online, False otherwise."""
        if self.need_token():
            self.get_token()
        # print(f"Requesting service status from {self.service_status_uri}")

        header_params = {"Authorization": f"Bearer {self.client_access_token}"}
        response = requests.get(
            self.service_status_uri, headers=header_params, cert=self.cert
        )
        if not response:
            print(f"No response from {self.service_status_uri}")
            return False
        if not str(response.status_code) == "200":
            print(f"Error: {response.status_code}, {response.text}")
            return False
        try:
            root = ET.fromstring(response.text)
            if root[0].text == "1":
                print("Service status is online.")
                return True
            print("Service status is offline.")
            return False
        except ET.ParseError:
            print(f"Could not parse XML: {response.text}")
            return False

    def get_published_period_start(self, authorization_uri):
        if self.need_token():
            self.get_token()

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
        except ET.ParseError:
            print(f"Could not parse XML: {response.text}")
            return

    def get_espi_data(self, resource_uri, access_token):
        if self.need_token():
            self.get_token()

        header_params = {"Authorization": f"Bearer {self.client_access_token}"}


class Pge(Api):
    """Pge client API."""

    pass
