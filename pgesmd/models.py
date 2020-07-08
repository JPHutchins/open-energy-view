from . import db


class User(db.Model):
    """Model for user accounts."""

    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    token = db.Column(db.String(256), nullable=True)
    pgesmd = db.relationship("PgeSmd", backref="users", lazy=True)

    def save_to_db(self) -> None:
        """Add the user to the TABLE users."""
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_email(cls, email) -> str:
        """Return the User instance for email if it exists, else None."""
        return cls.query.filter_by(email=email).first()

    @classmethod
    def return_all(cls) -> dict:
        """Return JSON list of all users."""

        def to_json(x):
            return {"email": x.email, "password": str(x.password)}

        return {"users": list(map(lambda x: to_json(x), User.query.all()))}

    @classmethod
    def delete_all(cls) -> dict:
        """Delete all users from the TABLE users."""
        try:
            num_rows_deleted = db.session.query(cls).delete()
            db.session.commit()
            return {"message": f"{num_rows_deleted} row(s) deleted"}
        except Exception as e:
            return {"message": f"Something went wrong: {e}"}


class PgeSmd(db.Model):
    """Model for PGE Share My Data API registration."""

    __tablename__ = "pgesmd"
    id = db.Column(db.Integer, primary_key=True)
    u_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    friendly_name = db.Column(db.String(100), nullable=True)
    # PGESMD registration information
    reg_type = db.Column(db.String(30), nullable=True)
    third_party_id = db.Column(db.Integer, nullable=True)
    client_id = db.Column(db.String(100), nullable=True)
    client_secret = db.Column(db.String(100), nullable=True)
    cert_crt_path = db.Column(db.String(100), nullable=True)
    cert_key_path = db.Column(db.String(100), nullable=True)
    # Information about the dataset
    last_entry = db.Column(db.Integer, default=0)
    last_update = db.Column(db.Integer, default=0)
    # Options
    partition_options = db.Column(db.String(1000), nullable=True)
    # Relationship to data tables
    espi = db.relationship("Espi", backref="pgesmd", lazy=True)
    __table_args__ = (db.UniqueConstraint(
        "friendly_name", "u_id",),)

    def save_to_db(self) -> None:
        """Add the account to the TABLE pgesmd."""
        db.session.add(self)
        db.session.commit()

    def __repr__(self) -> None:
        return (
            f"PgeSmd Account id: {self.id}, "
            f"u_id: {self.u_id}, "
            f"friendly_name: {self.friendly_name}"
        )


class Espi(db.Model):
    """Model for ESPI data from PGESMD API."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    watt_hours = db.Column(db.Integer, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start",),)
