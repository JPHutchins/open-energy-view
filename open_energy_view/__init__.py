from flask import Flask
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
        static_folder="./frontend/dist",
    )
    app.config.from_object("config.ProdConfig")

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
    rest.add_resource(resources.PgeOAuthRedirect, "/api/utility/pge/redirect_uri")
    rest.add_resource(resources.PgeOAuthPortal, "/api/utility/pge/oauth_portal")

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

    # Initialize demo data
    rest.add_resource(resources.TestAddXml, "/api/test/add/xml")

    # Initialize extensions with the Flask app
    db.init_app(app)
    rest.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

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

        return app
