"""API endpoints for viewing data."""
from flask import jsonify, redirect, abort, url_for, make_response
from base64 import b64encode
from os import environ
import time
import json
import requests
import re
from flask_restful import Resource, reqparse, request
from oauthlib.oauth2 import WebApplicationClient
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from sqlalchemy import exc
from cryptography.fernet import Fernet
import xml.etree.ElementTree as ET
from urllib.parse import quote

from . import models
from . import bcrypt
from . import db
from .utility_apis import Pge, FakeUtility, save_espi_xml
from .espi_helpers import insert_espi_xml_into_db
from .tasks import async_api

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

STATE = "originatedfromoev"

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

pge_api.get_service_status()
# pge_api.request_bulk_data()

#  TODO: add real fake endpoints and data
fake_api = FakeUtility(
    "fake",
    "fake",
    "fake",
    "fake",
    "fake",
    "fake",
    "fake",
    "fake",
    "fake",
    "fake",
    "fake",
)

auth_parser = reqparse.RequestParser()
auth_parser.add_argument("email", help="Cannot be blank", required=True)
auth_parser.add_argument("password", help="Cannot be blank", required=True)

get_data_parser = reqparse.RequestParser()
get_data_parser.add_argument("source", required=False)
get_data_parser.add_argument("lastUpdate", required=False)
get_data_parser.add_argument("name", required=False)
get_data_parser.add_argument("thirdPartyId", required=False)
get_data_parser.add_argument("clientId", required=False)
get_data_parser.add_argument("clientSecret", required=False)
get_data_parser.add_argument("payload", required=False)
get_data_parser.add_argument("usage_point", required=False)
get_data_parser.add_argument("friendly_name", required=False)
get_data_parser.add_argument("new_friendly_name", required=False)

test_add_parser = reqparse.RequestParser()
test_add_parser.add_argument("xml", required=True)

google_client = WebApplicationClient(GOOGLE_CLIENT_ID)
google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()

f = Fernet(API_RESPONSE_KEY)


class AuthToken(Resource):
    def make_cookies(self, id):
        access_token = create_access_token(identity=id)
        refresh_token = create_refresh_token(identity=id)
        resp = jsonify({"login": True})
        set_access_cookies(resp, access_token)
        set_refresh_cookies(resp, refresh_token)
        resp.set_cookie('logged_in', str(id))
        return resp


class Register(AuthToken):
    def post(self):
        data = auth_parser.parse_args()
        if models.User.find_by_email(data["email"]):
            return {"message": f'User {data["email"]} already exists.'}, 403

        new_user = models.User(
            email=data["email"],
            password=bcrypt.generate_password_hash(data["password"]).decode("utf-8"),
        )
        try:
            new_user.save_to_db()
            return self.make_cookies(new_user.id)
        except Exception as e:
            return {"message": str(e)}, 500
        finally:
            pass


class UserLogin(AuthToken):
    def post(self):
        data = auth_parser.parse_args()
        print(data["email"], data["password"])
        current_user = models.User.find_by_email(data["email"])
        if not current_user:
            return {"message": "Bad credentials"}, 401

        if bcrypt.check_password_hash(current_user.password, data["password"]):
            return self.make_cookies(current_user.id)
        else:
            return {"message": "Bad credentials"}, 401


class UserLogout(Resource):
    def post(self):
        resp = jsonify({"logout": True})
        unset_jwt_cookies(resp)
        resp.set_cookie('logged_in', "", expires=0)
        return resp


class TokenRefresh(Resource):
    @jwt_refresh_token_required
    def post(self):
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        refresh_token = create_refresh_token(identity=current_user)
        resp = jsonify({"refresh": True})
        set_access_cookies(resp, access_token)
        set_refresh_cookies(resp, refresh_token)
        resp.set_cookie('logged_in', str(current_user))
        return resp


class GoogleOAuthStart(Resource):
    def get(self):
        authorization_endpoint = google_provider_cfg["authorization_endpoint"]

        request_uri = google_client.prepare_request_uri(
            authorization_endpoint,
            redirect_uri="https://www.openenergyview.com/api/oauth",
            scope=["openid", "email", "profile"],
        )
        return redirect(request_uri)


class GoogleOAuthEnd(Resource):
    def get(self):
        code = request.args.get("code")
        token_endpoint = google_provider_cfg["token_endpoint"]

        token_url, headers, body = google_client.prepare_token_request(
            token_endpoint,
            authorization_response=request.url,
            redirect_url="https://www.openenergyview.com/api/oauth",
            code=code,
        )
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        )

        google_client.parse_request_body_response(json.dumps(token_response.json()))
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        uri, headers, body = google_client.add_token(userinfo_endpoint)
        userinfo_response = requests.get(uri, headers=headers, data=body)

        userinfo = userinfo_response.json()
        if userinfo.get("email_verified"):
            sub = userinfo["sub"]
        else:
            return "Unconfirmed email address.", 400

        current_user = models.User.find_by_oauth_id(sub)
        if current_user:
            access_token = create_access_token(current_user.id)
            refresh_token = create_refresh_token(current_user.id)
            resp = redirect("https://www.openenergyview.com")
            set_access_cookies(resp, access_token)
            set_refresh_cookies(resp, refresh_token)
            resp.set_cookie("logged_in", "true")
            return resp

        new_user = models.User(oauth_id=sub, oauth_provider="google",)
        try:
            new_user.save_to_db()
            access_token = create_access_token(new_user.id)
            refresh_token = create_refresh_token(new_user.id)
            resp = redirect("https://www.openenergyview.com")
            set_access_cookies(resp, access_token)
            set_refresh_cookies(resp, refresh_token)
            resp.set_cookie("logged_in", "true")
            return resp
        except Exception as e:
            return {"message": str(e)}, 500
        finally:
            pass


class PgeOAuthPortal(Resource):
    def get(self):
        # TODO: this needs to handle account creation - tailor message to referral utility
        TESTING = False
        REDIRECT_URI = "https://www.openenergyview.com/api/utility/pge/redirect_uri"
        testing_endpoint = "https://api.pge.com/datacustodian/test/oauth/v2/authorize"
        scope = ""
        args = request.args

        try:
            scope = args["scope"]
        except KeyError:
            pass

        authorizationServerAuthorizationEndpoint = (
            testing_endpoint
            if TESTING
            else "https://sharemydata.pge.com/myAuthorization"
        )
        query = (
            f"?client_id={PGE_CLIENT_ID}"
            f"&redirect_uri={REDIRECT_URI}"
            f"&response_type=code"
            f"&state={STATE}"
        )

        return redirect(f"{authorizationServerAuthorizationEndpoint}{query}")


class PgeOAuthRedirect(Resource):
    def get(self):
        args = request.args
        if args.get("state") != STATE:
            return {"error": "bad origin"}, 400

        REDIRECT_URI = "https://www.openenergyview.com/api/utility/pge/redirect_uri"
        URL = "https://api.pge.com/datacustodian/oauth/v2/token"

        print("got hit at redirect")

        try:
            authorization_code = args["code"]
        except KeyError:
            return {"error": "Missing parameter: authorization_code"}, 500

        b64 = b64encode(f"{PGE_CLIENT_ID}:{PGE_CLIENT_SECRET}".encode("utf-8"))
        auth_header = f"Basic {bytes.decode(b64)}"

        request_params = {
            "grant_type": "authorization_code",
            "code": authorization_code,
            "redirect_uri": REDIRECT_URI,
        }
        header_params = {"Authorization": auth_header}

        response = requests.post(
            URL,
            data=request_params,
            headers=header_params,
            cert=(CERT_PATH, KEY_PATH,),
        )
        print(response.text)

        user_info = json.loads(response.text)
        authorization_uri = user_info.get("authorizationURI")

        published_period_start = pge_api.get_published_period_start(authorization_uri)

        subscription_id = "unknown"
        if group := re.search(r"(?<=Subscription/)\d+", user_info.get("resourceURI")):
            subscription_id = group[0]

        if subscription_id != "unknown":
            usage_points = pge_api.get_usage_points(
                subscription_id, user_info.get("access_token")
            )

        user_info_dict = {
            "access_token": user_info.get("access_token"),
            "refresh_token": user_info.get("refresh_token"),
            "token_exp": int(user_info.get("expires_in")) + time.time(),
            "subscription_id": subscription_id,
            "published_period_start": published_period_start,
        }

        payload = f.encrypt(json.dumps(user_info_dict).encode("utf-8"))

        resp = redirect(
            f"https://www.openenergyview.com/#/pge_oauth"
            f"?payload={quote(payload)}"
            f"&usage_points={quote(json.dumps(usage_points))}"
        )

        return resp


class AddPgeSourceFromOAuth(Resource):
    @jwt_required
    def post(self):
        data = get_data_parser.parse_args()
        print(data["name"])
        print(data["payload"])

        name = data["name"]
        usage_point = data["usage_point"]
        user_info = bytes.decode(f.decrypt(data["payload"].encode("utf-8")))
        print(user_info)
        user_info = json.loads(user_info)

        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403

        new_account = models.Source(
            user_id=user.id,
            friendly_name=name,
            reg_type="oauth",
            subscription_id=user_info.get("subscription_id"),
            access_token=user_info.get("access_token"),
            token_exp=user_info.get("token_exp"),
            refresh_token=user_info.get("refresh_token"),
            usage_point=usage_point,
            published_period_start=user_info.get("published_period_start"),
        )
        new_account.save_to_db()
        pge_api.get_historical_data_incrementally(new_account)

        return redirect("https://www.openenergyview.com")


class FakeOAuthStart(Resource):
    def get(self):
        # TODO: get host IP - my WSL is not working on localhost so I can't use that...
        return redirect("http://172.26.214.5:5000/dist/index.html#/fake_oauth")


class AddFakeSourceFromFakeOAuth(Resource):
    @async_api
    @jwt_required
    def post(self):
        data = get_data_parser.parse_args()
        name = data["name"]
        print(get_jwt_identity())
        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403
        new_account = models.Source(user_id=user.id, friendly_name=name,)
        new_account.save_to_db()
        fake_api.get_historical_data_incrementally(new_account)

        return "Success"


class GetMeterReading(Resource):
    @jwt_required
    def post(self):
        data = get_data_parser.parse_args()
        friendly_name = data["friendly_name"]

        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        source = (
            db.session.query(models.Source)
            .filter_by(friendly_name=friendly_name)
            .with_parent(user)
            .first()
        )

        pge_api.get_meter_reading(source)

        return {}, 200


class GetSources(Resource):
    @jwt_required
    def post(self):
        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        sources_entries = db.session.query(models.Source).with_parent(user).all()
        sources = list(map(lambda x: x.friendly_name, sources_entries))
        return sources


class DeleteSource(Resource):
    @jwt_required
    def post(self):
        data = get_data_parser.parse_args()
        if not data["friendly_name"]:
            return {"error": "friendly_name required"}, 400

        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403

        return models.Source.delete(user, data["friendly_name"]), 200


class ChangeSourceName(Resource):
    @jwt_required
    def post(self):
        data = get_data_parser.parse_args()
        if not data["friendly_name"] and data["new_friendly_name"]:
            return {"error": "friendly_name and new_friendly_name required"}, 400

        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403

        source = (
            db.session.query(models.Source)
            .filter_by(friendly_name=data["friendly_name"])
            .with_parent(user)
            .first()
        )
        source.friendly_name = data["new_friendly_name"]
        try:
            db.session.commit()
            return {"message": "success"}, 200
        except Exception as e:
            print(e)
            return {"error": e}, 500


class GetPartitionOptions(Resource):
    @jwt_required
    def post(self):
        data = get_data_parser.parse_args()
        if not data["source"] or data["source"] == "None":
            return
        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        source = (
            db.session.query(models.Source)
            .filter_by(friendly_name=data["source"])
            .with_parent(user)
            .first()
        )
        return source.partition_options


class GetHourlyData(Resource):
    @jwt_required
    def post(self):
        data = get_data_parser.parse_args()
        if not data["source"] or data["source"] == "None":
            return

        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        source = (
            db.session.query(models.Source)
            .filter_by(friendly_name=data["source"])
            .with_parent(user)
            .first()
        )

        if (data["lastUpdate"]) and (int(data["lastUpdate"]) == source.last_update):
            return (
                {
                    "useLocalStorage": True,
                    "email": user.email,
                    "friendlyName": source.friendly_name,
                },
                200,
            )
        # TODO: currently entries are coming in reversed - research ORDER BY performance
        hours = (
            db.session.query(models.Espi)
            .filter_by(source_id=source.id, duration=3600)
            .order_by(models.Espi.start)
            .all()
        )
        database = ",".join(
            [f"{entry.start//3600}{entry.watt_hours}" for entry in hours]
        )
        response = {
            "useLocalStorage": False,
            "utility": "pge",
            "interval": 3600,
            "email": user.email,
            "friendlyName": data["source"],
            "lastUpdate": source.last_update,
            "partitionOptions": source.partition_options,
            "database": database,
        }
        return response, 200


class PgeRequestBulk(Resource):
    def post(self):
        pge_api.request_bulk_data()
        return {}, 200


class PgeNotify(Resource):
    def post(self):
        data = request.data
        print("notify hit", request.headers)
        save_espi_xml(data.decode("utf-8"))
        resource_uris = []
        try:
            root = ET.fromstring(data)
            for item in root:
                resource_uris.append(item.text)
        except ET.ParseError:
            # print(f'Could not parse message: {data}')
            return f"Could not parse message: {data}", 500

        print(resource_uris)

        pge_api.get_daily_deltas(resource_uris, save=False)

        return {}, 200


class AddCustomSource(Resource):
    @jwt_required
    def post(self):
        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403
        data = get_data_parser.parse_args()
        new_account = models.Source(
            user_id=user.id,
            friendly_name=data["name"],
            reg_type="self",
            subscription_id=data["thirdPartyId"],
            client_id=data["clientId"],
            client_secret=data["clientSecret"],
        )
        new_account.save_to_db()


class UploadXml(Resource):
    @jwt_required
    def post(self):
        friendly_name = request.args.get("friendly_name")
        if not friendly_name:
            friendly_name = "PG&E Test XML upload"
        if request.files:
            xml = request.files.get("xml").read().decode("utf-8")

        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403

        source = (
            db.session.query(models.Source)
            .filter_by(friendly_name=friendly_name)
            .with_parent(user)
            .first()
        )

        insert_espi_xml_into_db(xml, source.id)

        return {}, 200


class TestAddXml(Resource):
    def post(self):
        test_xml = [
            "/home/jp/pgesmd/test/data/espi/espi_2_years.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-16.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-17.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-18.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-19.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-20.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-21.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-22.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-23.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-24.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-25.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-26.xml",
            "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-27.xml",
        ]
        data = test_add_parser.parse_args()
        with open(test_xml[int(data.xml)]) as xml_reader:
            xml = xml_reader.read()
        # bulk_id = get_bulk_id_from_xml(xml)
        bulk_id = 55555

        source_id = (
            db.session.query(models.Source)
            .filter_by(subscription_id=bulk_id)
            .first()
            .id
        )

        insert_espi_xml_into_db(xml, source_id)

        return {}, 200


# class CatchAll(Resource):
#     @async_api
#     def get(self, path=''):
#         # perform some intensive processing
#         print("starting processing task, path: '%s'" % path)
#         time.sleep(30)
#         print("completed processing task, path: '%s'" % path)
#         return f'The answer is: {path}'
