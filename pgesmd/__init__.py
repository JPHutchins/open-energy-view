import os
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from .helpers import parse_espi_data

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
    app.config.from_object("config.DevConfig")

    from . import resources

    # Set Restful API endpoints
    rest.add_resource(resources.Register, "/api/register")
    rest.add_resource(resources.UserLogin, "/token/auth")
    rest.add_resource(resources.UserLogout, "/token/remove")
    rest.add_resource(resources.TokenRefresh, "/token/refresh")
    rest.add_resource(resources.AllUsers, "/users")
    rest.add_resource(resources.SecretResource, "/api/secret")
    rest.add_resource(resources.AddDemoPge, "/api/addpge")
    rest.add_resource(resources.AddPgeSource, "/api/add/pge")
    rest.add_resource(resources.GetHours, "/api/hours")
    rest.add_resource(resources.GetSources, "/api/sources")
    rest.add_resource(resources.GetPartitionOptions, "/api/partitionOptions")
    rest.add_resource(resources.GetEnergyHistoryHours, "/api/energyHistory")

    # Initialize extensions with the Flask app
    db.init_app(app)
    rest.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    

    with app.app_context():
        # Create the tables for our models
        db.create_all()

        # Add the demo data to the database
        xml_fp = open(f"{PROJECT_PATH}/test/data/espi/espi_2_years.xml")
        xml = xml_fp.read()
        xml_fp.close()
        i = 0
        data_update = []
        for entry in parse_espi_data(xml):
              data_update.append({
                  'pge_id': 50916,
                  'start': entry[0],
                  'duration': entry[1],
                  'watt_hours': entry[2]
              })
        conn = db.engine.connect()
        print(models.Espi.__table__)
        # x = conn.execute(models.Espi.__table__.insert(), data_update)
        # print(x)


        @app.route("/")
        def index():
            return render_template("index.html")

        return app
