from open_energy_view import create_app
from os import environ


app = create_app(f"open_energy_view.{environ.get('FLASK_CONFIG')}")

if __name__ == "__main__":
    app.run(host="0.0.0.0")
