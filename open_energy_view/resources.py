"""API endpoints for viewing data."""
from flask import jsonify, redirect, abort, url_for, make_response
from base64 import b64encode
import os
import time
import json
import requests
import re
from typing import List
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
from urllib.parse import quote, parse_qs
from gevent import sleep
from celery import chain
from celery.result import AsyncResult

from . import errors
from . import models
from . import bcrypt
from . import db
from .utility_apis import Pge, FakeUtility
from .espi_helpers import save_espi_xml
from .celery_tasks import get_jp, insert_espi_xml_into_db, process_data
from .celery import celery

IP_AND_PORT = os.environ.get("IP_AND_PORT")

PGE_BULK_ID = 51070
PGE_CLIENT_ID = os.environ.get("PGE_CLIENT_ID")
PGE_CLIENT_SECRET = os.environ.get("PGE_CLIENT_SECRET")
PGE_REGISTRATION_ACCESS_TOKEN = os.environ.get("PGE_REGISTRATION_ACCESS_TOKEN")
CERT_PATH = os.environ.get("CERT_PATH")
KEY_PATH = os.environ.get("KEY_PATH")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
API_RESPONSE_KEY = os.environ.get("API_RESPONSE_KEY")

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
get_data_parser.add_argument("names", required=False)
get_data_parser.add_argument("thirdPartyId", required=False)
get_data_parser.add_argument("clientId", required=False)
get_data_parser.add_argument("clientSecret", required=False)
get_data_parser.add_argument("payload", required=False)
get_data_parser.add_argument("usage_point", required=False)
get_data_parser.add_argument("friendly_name", required=False)
get_data_parser.add_argument("new_friendly_name", required=False)

test_add_parser = reqparse.RequestParser()
test_add_parser.add_argument("xml", required=True)

task_parser = reqparse.RequestParser()
task_parser.add_argument("taskId", required=True)

google_client = WebApplicationClient(GOOGLE_CLIENT_ID)
google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()

f = Fernet(API_RESPONSE_KEY or "81HqDtbqAywKSOumSha3BhWNOdQ26slT6K0YaZeZyPs=")


class AuthToken(Resource):
    def make_cookies(self, id):
        access_token = create_access_token(identity=id)
        refresh_token = create_refresh_token(identity=id)
        resp = jsonify({"login": True})
        set_access_cookies(resp, access_token)
        set_refresh_cookies(resp, refresh_token)
        resp.set_cookie("logged_in", str(id))
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
        resp.set_cookie("logged_in", "", expires=0)
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
        resp.set_cookie("logged_in", str(current_user))
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
            print(f"{args.get('state')} does not equal {STATE}")

        print(args)

        REDIRECT_URI = "https://www.openenergyview.com/api/utility/pge/redirect_uri"
        URL = "https://api.pge.com/datacustodian/oauth/v2/token"

        print("got hit at redirect")

        try:
            authorization_code = args["code"]
        except KeyError:
            return {"error": "Missing parameter: authorization_code"}, 500

        b64 = b64encode(f"{PGE_CLIENT_ID}:{PGE_CLIENT_SECRET}".encode("utf-8"))
        auth_header = f"Basic {bytes.decode(b64)}"

        print(authorization_code)

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
        # print(response.text)

        user_info = json.loads(response.text)
        if user_info.get("error"):
            print(response.text)
            return redirect("https://www.openenergyview.com")
        print(response.text)
        authorization_uri = user_info.get("authorizationURI")

        published_period_start = pge_api.get_published_period_start(authorization_uri)

        subscription_id = None
        if group := re.search(r"(?<=Subscription/)\d+", user_info.get("resourceURI")):
            subscription_id = group[0]

        access_token = user_info.get("access_token")

        # TODO: make these frontend initiated requests
        if subscription_id and access_token:
            usage_points = pge_api.get_usage_points(subscription_id, access_token)
            usage_points = pge_api.get_service_locations(
                subscription_id, usage_points, access_token
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
    def get(self):
        args = get_data_parser.parse_args()
        names = args.get("names")
        payload = args.get("payload")

        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403

        if names:
            names = json.loads(names)
        else:
            return {"error": "no names received"}, 500

        user_info = bytes.decode(f.decrypt(payload.encode("utf-8")))
        user_info = json.loads(user_info)

        task_ids = []
        failed_usage_points = []

        for usage_point, entry in names.items():
            if entry["kind"] != "electricity":
                continue  # TODO: support gas records
            try:
                new_source = models.Source(
                    user_id=user.id,
                    friendly_name=entry["name"],
                    resource_type=entry["kind"],
                    reg_type="oauth",
                    subscription_id=user_info.get("subscription_id"),
                    access_token=user_info.get("access_token"),
                    token_exp=user_info.get("token_exp"),
                    refresh_token=user_info.get("refresh_token"),
                    usage_point=usage_point,
                    published_period_start=user_info.get("published_period_start"),
                )

                try:
                    task_ids.append(
                        pge_api.get_historical_data_incrementally(new_source).id
                    )
                except errors.OEVErrorIntervalBlockURLNotFound:
                    failed_usage_points.append(usage_point)
                    continue

                new_source.save_to_db()

            except exc.IntegrityError:
                db.session.rollback()
                source = (
                    db.session.query(models.Source)
                    .filter_by(friendly_name=entry["name"])
                    .first()
                )
                source.user_id = user.id
                source.resource_type = entry["kind"]
                source.reg_type = "oauth"
                source.subscription_id = user_info.get("subscription_id")
                source.access_token = user_info.get("access_token")
                source.token_exp = user_info.get("token_exp")
                source.refresh_token = user_info.get("refresh_token")
                source.usage_point = usage_point
                source.published_period_start = user_info.get("published_period_start")
                db.session.commit()
                task_ids.append(pge_api.get_historical_data_incrementally(source).id)

        if len(task_ids) == 0:
            if len(failed_usage_points) > 0:
                return {"error": f"Could not retrieve usage points: {failed_usage_points}"}, 500
            return {"message": "No electrical service submitted."}, 200
        return (
            task_ids[0],
            202,
        )  # TODO: rethink status bar? keep user busy while API fetch?


class FakeOAuthStart(Resource):
    def get(self):
        # TODO: get host IP on Dev mode - my WSL is not working on localhost...
        return redirect(f"http://{IP_AND_PORT}/#/fake_oauth")


class AddFakeSourceFromFakeOAuthOLD(Resource):
    #  @async_api
    @jwt_required
    def get(self):
        query_string = request.environ.get("QUERY_STRING")
        query_dict = parse_qs(query_string)

        name_list = query_dict.get("name")
        if name_list and len(name_list) > 0:
            name = name_list[0]
        else:
            return "Failure"

        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403
        new_account = models.Source(
            user_id=user.id, friendly_name=name, usage_point="5391320451"
        )
        new_account.save_to_db()
        fake_api.get_historical_data_incrementally(new_account)

        return "Success"


class AddFakeSourceFromFakeOAuth(Resource):
    @jwt_required
    def get(self):
        name = get_data_parser.parse_args().get("name")
        user = db.session.query(models.User).filter_by(id=get_jwt_identity()).first()
        if user.email == "jph@demo.com":
            return {"error": "cannot modify demo account"}, 403
        new_account = models.Source(
            user_id=user.id, friendly_name=name, usage_point="5391320451"
        )
        new_account.save_to_db()
        task_id = fake_api.get_historical_data_incrementally().id
        return task_id, 202


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
        intervals: List[models.Espi] = (
            db.session.query(models.Espi)
            .filter_by(source_id=source.id)
            .order_by(models.Espi.start)
            .all()
        )

        next_start = intervals[0].start if len(intervals) > 0 else -1
        previous_start = next_start - 1
        interval_duration_sum = 0
        interval_watt_hours_sum = 0
        hours = []
        current_hour = -1
        next_hour = -1

        for interval in intervals:
            if interval.start <= previous_start:
                if interval.start == previous_start:
                    # ignore duplicates
                    print("Duplicate interval start!")
                    continue
                raise Exception("Intervals out of order!")

            previous_start = interval.start

            if interval.duration == 3600:
                # interval duration accepted by OEV frontend
                hours.append(f"{interval.start//3600}{interval.watt_hours}")
                # set next_start to beginning of next hour
                next_start = interval.start + interval.duration
                continue
            
            # sum the intervals to an hour, if possible

            # if we were "off track", this can find the start of an hour again
            if float(interval.start / 3600).is_integer():
                next_start = interval.start
                interval_duration_sum = 0
                interval_watt_hours_sum = 0
                current_hour = interval.start
                next_hour = current_hour + 3600

            # we are "off track" - bad entry?
            if interval.start != next_start:
                print("Bad interval start?")
                continue

            interval_duration_sum += interval.duration
            interval_watt_hours_sum += (interval.watt_hours * 3600 / interval.duration)
            next_start = interval.start + interval.duration

            if next_start == next_hour:
                if interval_duration_sum != 3600:
                    print("Bad interval sum!")
                    interval_duration_sum = 0
                    interval_watt_hours_sum = 0
                    continue
                # finished summing the intervals to an hour
                hours.append(f"{current_hour//3600}{interval_watt_hours_sum}")

        database = ",".join(hours)

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
        # print("notify hit", request.headers)
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

        task = insert_espi_xml_into_db.delay(xml, given_source_id=source.id)

        while not task.ready():
            sleep(1)

        return {}, 200


class TestCelery(Resource):
    def get(self):
        result = chain(get_jp.s(), process_data.s())()
        return result.id


class CheckTaskStatus(Resource):
    def post(self):
        task_id = task_parser.parse_args().get("taskId")
        task = celery.AsyncResult(task_id)
        if task.ready():
            return task.get(), 200
        return {}, 202
