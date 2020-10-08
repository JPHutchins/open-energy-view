from os import environ

from .utility_apis import Pge


PGE_BULK_ID = 51070
PGE_CLIENT_ID = environ.get("PGE_CLIENT_ID")
PGE_CLIENT_SECRET = environ.get("PGE_CLIENT_SECRET")
PGE_REGISTRATION_ACCESS_TOKEN = environ.get("PGE_REGISTRATION_ACCESS_TOKEN")
CERT_PATH = environ.get("CERT_PATH")
KEY_PATH = environ.get("KEY_PATH")
GOOGLE_CLIENT_ID = environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
API_RESPONSE_KEY = environ.get("API_RESPONSE_KEY")


pge_api = Pge(
    PGE_BULK_ID,
    PGE_CLIENT_ID,
    PGE_CLIENT_SECRET,
    PGE_REGISTRATION_ACCESS_TOKEN,
    CERT_PATH,
    KEY_PATH,
    "https://api.pge.com/datacustodian/oauth/v2/token",
    "https://api.pge.com/datacustodian/oauth/v2/token",
    "pass",
    "https://api.pge.com/GreenButtonConnect",
    "https://api.pge.com/GreenButtonConnect/espi/1_1/resource/ReadServiceStatus",
)
