"""
    ClientCredentials.py
    ~~~~~~~~~~~~~~~~~~~~
	This API for  to get client_credentials from PG&E 	
	
    This is used by PG&E thrid parties.
	
	:Author: Bharati V
"""

import requests
import json
from base64 import b64encode


class ClientCredentials:
    def __init__(self, client_credentials_hash, cert_params_hash):
        client_key = client_credentials_hash["client_key"]
        client_secret_key = client_credentials_hash["client_secret_key"]
        self.cert = (cert_params_hash["crt"], cert_params_hash["key"])
        self.base64code = "Basic " + bytes.decode(
            b64encode(
                ("%s:%s" % (client_key, client_secret_key)).encode("latin1")
            ).strip()
        )

    # To get client_credentials	from PG&E
    def get_client_access_token(self, url):
        request_params = {"grant_type": "client_credentials"}
        header_params = {"Authorization": self.base64code}
        response = requests.post(
            url, data=request_params, headers=header_params, cert=self.cert
        )
        if str(response.status_code) == "200":
            res = response.json()
            res.update({"status": response.status_code})
            return res
        return {"status": response.status_code, "error": response.text}
