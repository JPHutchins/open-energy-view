"""
    OAuth2.py
    ~~~~~~~~~~~~~

	For safe Authentication OAuth2 is defined.
	This API's provides the  OAuth2 access token from PG&E.
	
    This is used by PG&E thrid parties.
	
	:Author: Bharati V
"""


import requests
import json
from base64 import b64encode


class OAuth2:
    def __init__(self, client_credentials_hash, cert_params_hash):
        client_key = client_credentials_hash["client_key"]
        client_secret_key = client_credentials_hash["client_secret_key"]
        self.cert = (cert_params_hash["crt"], cert_params_hash["key"])
        self.base64code = "Basic " + bytes.decode(
            b64encode(
                ("%s:%s" % (client_key, client_secret_key)).encode("latin1")
            ).strip()
        )

    # Get Acces Token
    def get_access_token(self, url, code, redirect_uri):
        request_params = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
        header_params = {"Authorization": self.base64code}
        request = requests.post(
            url, data=request_params, headers=header_params, cert=self.cert
        )
        if str(request.status_code) == "200":
            res = request.json()
            res.update({"status": request.status_code})
            return res
        response = {"status": request.status_code, "error": request.text}
        return response

    # Refresh token will collect back the new access token
    def get_refresh_token(self, url, refresh_token):
        request_params = {"grant_type": "refresh_token", "refresh_token": refresh_token}
        header_params = {"Authorization": self.base64code}
        request = requests.post(
            url, data=request_params, headers=header_params, cert=self.cert
        )
        if str(request.status_code) == "200":
            res = request.json()
            res.update({"status": request.status_code})
            return res
        response = {"status": request.status_code, "error": request.text}
        return response
