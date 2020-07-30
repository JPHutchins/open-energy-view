import os
from time import time
from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from xml.etree import cElementTree as ET
from sqlalchemy import exc
from pgesmd_self_access.helpers import (
    parse_espi_data,
    get_auth_file,
    get_bulk_id_from_xml,
)
from pgesmd_self_access.api import SelfAccessApi

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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
    app.config.from_object("config.ProdConfig")

    from . import resources

    # Authentication
    rest.add_resource(resources.Register, "/api/web/register")
    rest.add_resource(resources.UserLogin, "/api/web/token/auth")
    rest.add_resource(resources.UserLogout, "/api/web/token/remove")
    rest.add_resource(resources.TokenRefresh, "/api/web/token/refresh")

    # Utility OAuth
    rest.add_resource(resources.PgeOAuthRedirect, "/api/utility/pge/redirect_url")
    rest.add_resource(resources.PgeOAuthPortal, "/api/utility/pge/oauth_portal")

    # Get data
    rest.add_resource(resources.GetSources, "/api/web/sources")
    rest.add_resource(resources.GetPartitionOptions, "/api/web/partition-options")
    rest.add_resource(resources.GetHourlyData, "/api/web/data/hours")

    # Utility or device notify endpoints
    rest.add_resource(resources.PgeNotify, "/api/utility/pge/notify")

    # Initialize demo data
    rest.add_resource(resources.AddPgeDemoSource, "/api/add/pge-demo")
    rest.add_resource(resources.TestAddXml, "/api/test/add/xml")

    # Initialize extensions with the Flask app
    db.init_app(app)
    rest.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        db.create_all()

        @app.route("/pgesmd", methods=["POST"])
        def handle_pgesmd_post():
            # legacy for Self Access API testing
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
            source_id = (
                db.session.query(models.Source)
                .filter_by(provider_id=bulk_id)
                .first()
                .id
            )

            data_update = []
            last_entry = ""
            for entry in parse_espi_data(xml):
                data_update.append(
                    {
                        "source_id": source_id,
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
                    "INSERT OR IGNORE INTO espi (source_id, start, duration, watt_hours) VALUES (:source_id, :start, :duration, :watt_hours)",
                    data_update,
                )
            finally:
                timestamp = int(time() * 1000)
                source_row = db.session.query(models.Source).filter_by(id=source_id)
                source_row.update({"last_entry": last_entry})
                source_row.update({"last_update": timestamp})
                db.session.commit()

            return {}, 200

        return app
