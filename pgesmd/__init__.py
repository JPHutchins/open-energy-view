"""Initialize the application backend."""

import os
from flask import Flask, render_template, request
import json
from flask_login import LoginManager, UserMixin
from flask_jwt_extended import (JWTManager, jwt_required,
                                jwt_refresh_token_required,
                                jwt_optional, fresh_jwt_required,
                                get_raw_jwt, get_jwt_identity,
                                create_access_token, create_refresh_token,
                                set_access_cookies, set_refresh_cookies,
                                unset_jwt_cookies, unset_access_cookies)
from pgesmd.database import EnergyHistory
from flask_bcrypt import Bcrypt

PROJECT_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def create_app(test_config=None):
    """Create the Flask app."""
    app = Flask(__name__,
                instance_relative_config=True,
                static_folder=f"./frontend/dist",
                template_folder=f"./frontend")
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=f'{PROJECT_PATH}/data/energy_history.db',
        JWT_SECRET_KEY='dev',
        JWT_TOKEN_LOCATION='cookies',
        JWT_COOKIE_CSRF_PROTECT=True,
        JWT_CSRF_CHECK_FORM=True
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # jwt = JWT(app, authenticate, identity)
    bcrypt = Bcrypt(app)

    pw_hash = bcrypt.generate_password_hash('demo')


    # initialize the database for json requests
    db = EnergyHistory(path='/test/data/energy_history_test.db')
    db.save_json()

    db.cursor.execute("""REPLACE INTO users (
        email,
        hash)
        VALUES ('demo@demo.com', ?);""", (pw_hash,))
    db.cursor.execute("COMMIT")

    # initialize flask-login
    login_manager = LoginManager()
    login_manager.init_app(app)

    class User:
        def __init__(self, user_id):
            self.id = user_id

    def authenticate(email, password):
        db = EnergyHistory(path='/test/data/energy_history_test.db')
        db.cursor.execute("SELECT id FROM users WHERE email=?;", (email,))
        user_id = db.cursor.fetchone()[0]
        db.cursor.execute("SELECT hash FROM users WHERE id=?;", (user_id,))
        pw_hash = db.cursor.fetchone()[0]
        if user_id and bcrypt.check_password_hash(pw_hash, password):
            return User(user_id)
    
    def identity(payload):
        db = EnergyHistory(path='/test/data/energy_history_test.db')
        user_id = payload['identity']
        db.cursor.execute("SELECT email FROM users WHERE id=?;", (user_id,))
        email = db.cursor.fetchone()[0]
        return email
    
    jwt = JWTManager(app, authenticate, identity)

    @app.route('/testauth')
    @jwt_required()
    def testauth():
        print('Found user: %s' % current_identity)
        return '%s' % current_identity

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/authCustom', methods=['POST'])
    def login():
        print("hit that login route yo")
        print(request.get_json())
        email = request.get_json()['email']
        password = request.get_json()['password']
        print(authenticate(email, password))
        return "success"

    @app.route('/data/json/now', methods=['GET'])
    def get_json_now():
        json_now = {
            'info': db.json['info'],
            'hour': db.json['hour'][-168:],
            'part': db.json['part'][
                db.json['hour'][-168]['i_part']:db.json['hour'][-1]['i_part']]
        }
        json_string = json.dumps(json_now)
        return json_string

    @app.route('/data/json', methods=['GET'])
    def get_json():
        json_string = json.dumps(db.json)
        return json_string

    return app
