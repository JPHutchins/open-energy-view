import os
from time import time
from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from xml.etree import cElementTree as ET
from sqlalchemy import exc
from pgesmd_self_access.helpers import parse_espi_data, get_auth_file, get_bulk_id_from_xml
from pgesmd_self_access.api import SelfAccessApi

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INIT_DEMO_DB = False


db = SQLAlchemy()
rest = Api()
bcrypt = Bcrypt()
jwt = JWTManager()


def create_app() -> Flask:
    """Initialize the application."""
    app = Flask(
        __name__,
        instance_relative_config=False,
        template_folder="./frontend",
        static_folder="./frontend/dist",
    )
    app.config.from_object("config.DevConfig")

    from . import resources

    # Rest API endpoints
    rest.add_resource(resources.Register, "/api/register")
    rest.add_resource(resources.UserLogin, "/token/auth")
    rest.add_resource(resources.UserLogout, "/token/remove")
    rest.add_resource(resources.TokenRefresh, "/token/refresh")
    rest.add_resource(resources.AllUsers, "/users")
    rest.add_resource(resources.SecretResource, "/api/secret")
    rest.add_resource(resources.AddDemoPge, "/api/addpge")
    rest.add_resource(resources.AddPgeSource, "/api/add/pge")
    rest.add_resource(resources.GetSources, "/api/sources")
    rest.add_resource(resources.GetPartitionOptions, "/api/partitionOptions")
    rest.add_resource(resources.GetEnergyHistoryHours, "/api/energyHistory")
    rest.add_resource(resources.TestAddXml, "/test/add/xml")

    # Initialize extensions with the Flask app
    db.init_app(app)
    rest.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        db.create_all()

        # Add the demo data to the database
        if INIT_DEMO_DB:
            xml_fp = open(f"{PROJECT_PATH}/test/data/espi/espi_2_years.xml")
            xml = xml_fp.read()
            xml_fp.close()

            data_update = []
            for entry in parse_espi_data(xml):
                data_update.append(
                    {
                        "pge_id": 50916,
                        "start": entry[0],
                        "duration": entry[1],
                        "watt_hours": entry[2],
                    }
                )
            conn = db.engine.connect()
            print(models.Espi.__table__)
            x = conn.execute(models.Espi.__table__.insert(), data_update)
            print(x)

        @app.route("/pge_false", methods=["GET"])
        def pge_test():
            print(request.data)
            with open(
                "/home/jp/pgesmd/test/data/espi/Single Days/2019-10-27.xml"
            ) as xml_reader:
                xml = xml_reader.read()
            return xml

        @app.route("/pgesmd", methods=["POST"])
        def handle_pgesmd_post():
            data = request.data
            try:
                resource_uri = ET.fromstring(data)[0].text
            except ET.ParseError:
                # print(f'Could not parse message: {data}')
                return f"Could not parse message: {data}", 500
            except IndexError as e:
                print(e, data)
                auth = get_auth_file(f"{PROJECT_PATH}/auth/auth.json")
                api = SelfAccessApi(*auth)
                api.request_latest_data()
                return f'No index "0" in parsed XML: {data}', 500

            auth = get_auth_file(f"{PROJECT_PATH}/auth/auth.json")
            api = SelfAccessApi(*auth)

            xml = api.get_espi_data(resource_uri)
            bulk_id = get_bulk_id_from_xml(xml)

            data_update = []
            last_entry = ""
            for entry in parse_espi_data(xml):
                data_update.append(
                    {
                        "pge_id": bulk_id,
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
                    "INSERT OR IGNORE INTO espi (pge_id, start, duration, watt_hours) VALUES (:pge_id, :start, :duration, :watt_hours)",
                    data_update,
                )
            finally:
                timestamp = int(time() * 1000)
                pgesmd_row = db.session.query(models.PgeSmd).filter_by(
                    third_party_id=bulk_id
                )
                pgesmd_row.update({"last_entry": last_entry})
                pgesmd_row.update({"last_update": timestamp})
                db.session.commit()

            return {}, 200

        return app
