"""Initialize the application backend."""

import os
from flask import Flask, render_template
import json
from flask_login import LoginManager, UserMixin
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from pgesmd.database import EnergyHistory

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

    # initialize the database for json requests
    db = EnergyHistory(path='/test/data/energy_history_test.db')
    db.save_json()

    # initialize flask-login
    login_manager = LoginManager()
    login_manager.init_app(app)

    @app.route('/')
    def index():
        return render_template('index.html')

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
