from open_energy_view import create_app
from os import environ
from open_energy_view import config


app = create_app(config.DevConfig)

if __name__ == "__main__":
    app.run(host='0.0.0.0')
