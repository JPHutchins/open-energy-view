import os
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

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
        static_folder=f"./frontend/dist",
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
    rest.add_resource(resources.GetDatabase, "/api/data")
    rest.add_resource(resources.GetHours, "/api/hours")
    rest.add_resource(resources.GetSources, "/api/sources")

    # Initialize extensions with the Flask app
    db.init_app(app)
    rest.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        # Create the tables for our models
        db.create_all()

        @app.route("/")
        def index():
            return render_template("index.html")

        return app
