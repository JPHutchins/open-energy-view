"""
    api.py
    ~~~~~~~~~~~~~
	This API for the  synchronous and Asynchronous XML data to get from the PG&E.
    This is used by PG&E thrid parties.
	:Author: Bharati V
"""

import requests
import json
from base64 import b64encode


class Api:
    def __init__(self, cert_params_hash):
        self.cert = (cert_params_hash["crt"], cert_params_hash["key"])

    # API sync request using Oauth2 access token
    def sync_request(
        self,
        url,
        subscription_id,
        usage_point,
        published_min,
        published_max,
        access_token,
    ):
        url = url + "/Subscription/" + subscription_id + "/UsagePoint/" + usage_point
        url = (
            url + "?published-max=" + published_max + "&published-min=" + published_min
        )
        header_params = {"Authorization": "Bearer " + access_token}
        request = requests.get(url, data={}, headers=header_params, cert=self.cert)
        if str(request.status_code) == "200":
            response = {"status": request.status_code, "data": request.text}
            return response
        response = {"status": request.status_code, "error": request.text}
        return response

    # API async request using Oauth2 access token
    def async_request(
        self, url, subscription_id, published_min, published_max, access_token
    ):
        url = url + "/Subscription/" + subscription_id
        url += "?published-max=" + published_max + "&published-min=" + published_min
        header_params = {"Authorization": "Bearer " + access_token}
        request = requests.get(url, data={}, headers=header_params, cert=self.cert)
        if str(request.status_code) == "202":
            response = {"status": request.status_code, "data": request.text}
            return response
        response = {"status": request.status_code, "error": request.text}
        return response
