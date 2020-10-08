import requests
from xml.etree import cElementTree as ET


def request_url(
    method, url, params=None, data=None, headers=None, cert=None, format=None
):
    response = requests.request(
        method, url, params=params, data=data, headers=headers, cert=cert
    )
    if not response:
        print(f"No response from {url}")
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
    elif format == "text":
        try:
            return response.text
        except Exception as e:
            print(e)
            pass
    else:
        return response
