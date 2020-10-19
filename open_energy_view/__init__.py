from gevent import monkey

monkey.patch_all()


from os import environ
from flask import Flask, url_for, abort, request, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager


db = SQLAlchemy()
rest = Api()
bcrypt = Bcrypt()
jwt = JWTManager()


def create_app(config_name) -> Flask:
    """Initialize the application."""
    app = Flask(
        __name__,
        instance_relative_config=False,
        template_folder="./frontend/dist/",
        static_folder="./frontend/dist/",
        static_url_path="",
    )
    app.config.from_object(config_name)
    from . import resources

    # Authentication
    rest.add_resource(resources.Register, "/api/web/register")
    rest.add_resource(resources.UserLogin, "/api/web/token/auth")
    rest.add_resource(resources.UserLogout, "/api/web/token/remove")
    rest.add_resource(resources.TokenRefresh, "/api/web/token/refresh")
    # OAuth 2
    rest.add_resource(resources.GoogleOAuthStart, "/api/oauth/google")
    rest.add_resource(resources.GoogleOAuthEnd, "/api/oauth")

    # Utility OAuth
    rest.add_resource(resources.PgeOAuthPortal, "/api/utility/pge/oauth_portal")
    rest.add_resource(resources.PgeOAuthRedirect, "/api/utility/pge/redirect_uri")

    # Add data source
    rest.add_resource(resources.AddCustomSource, "/api/web/add/custom-source")
    rest.add_resource(resources.AddPgeSourceFromOAuth, "/api/web/add/pge_oauth")

    # Get data
    rest.add_resource(resources.GetSources, "/api/web/sources")
    rest.add_resource(resources.GetPartitionOptions, "/api/web/partition-options")
    rest.add_resource(resources.GetHourlyData, "/api/web/data/hours")
    rest.add_resource(resources.GetMeterReading, "/api/web/data/meter-reading")

    # Utility or device notify endpoints
    rest.add_resource(resources.PgeNotify, "/api/utility/pge/notify")

    # User interactions
    rest.add_resource(resources.UploadXml, "/api/web/upload-xml")
    rest.add_resource(resources.DeleteSource, "/api/web/delete-source")
    rest.add_resource(resources.ChangeSourceName, "/api/web/change-source-name")

    # Tests
    rest.add_resource(resources.FakeOAuthStart, "/api/utility/fake/redirect_uri")
    rest.add_resource(resources.AddFakeSourceFromFakeOAuth, "/api/web/add/fake_oauth")

    # Task status
    rest.add_resource(resources.TestCelery, "/api/celery")
    rest.add_resource(resources.CheckTaskStatus, "/api/web/task")

    # Initialize extensions with the Flask app
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    rest.init_app(app)

    with app.app_context():
        db.create_all()

        # Setup the demo user and data
        demo_user = (
            db.session.query(models.User).filter_by(email="jph@demo.com").first()
        )
        if not demo_user:
            demo_user = models.User(
                email="jph@demo.com",
                password=bcrypt.generate_password_hash("demo").decode("utf-8"),
            )
            try:
                demo_user.save_to_db()
            except Exception as e:
                print(e)

        #  Really need to be setting Dev/Prod flags for stuff like this
        #  Technically this will get intercepted by Nginx in production
        @app.route("/")
        def index():
            return render_template("index.html")

        return app
