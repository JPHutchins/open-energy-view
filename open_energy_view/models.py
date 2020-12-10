from . import db


class User(db.Model):
    """Model for user accounts."""

    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password = db.Column(db.String(256), nullable=True)
    oauth_id = db.Column(db.String(256), unique=True, nullable=True)
    oauth_provider = db.Column(db.String(120), nullable=True)
    token = db.Column(db.String(256), nullable=True)
    sources = db.relationship("Source", backref="users", lazy=True)

    def __repr__(self):
        return f"User\nid: {self.id}\nemail: {self.email}\nsources: {self.sources}\n"

    def save_to_db(self) -> None:
        """Add the user to the TABLE users."""
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_oauth_id(cls, oauth_id) -> str:
        """Return the User instance for the oauth_id if it exists, else None."""
        return cls.query.filter_by(oauth_id=oauth_id).first()

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


class Source(db.Model):
    """Model for data sources."""

    __tablename__ = "sources"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    friendly_name = db.Column(db.String(100), nullable=True)
    # PGESMD registration information
    utility = db.Column(db.String(100), nullable=True)
    reg_type = db.Column(db.String(30), nullable=True)
    subscription_id = db.Column(db.Integer, nullable=True)
    usage_point = db.Column(db.Integer, nullable=True)
    resource_type = db.Column(db.String(50), nullable=True, default="electricity")
    access_token = db.Column(db.String(100), nullable=True)
    token_exp = db.Column(db.Integer, nullable=True)
    refresh_token = db.Column(db.String(100), nullable=True)
    client_id = db.Column(db.String(100), nullable=True)
    client_secret = db.Column(db.String(100), nullable=True)
    cert_crt_path = db.Column(db.String(100), nullable=True)
    cert_key_path = db.Column(db.String(100), nullable=True)
    # Information about the dataset
    published_period_start = db.Column(db.Integer, nullable=True)
    last_entry = db.Column(db.Integer, default=0)
    last_update = db.Column(db.Integer, default=0)
    # Options
    partition_options = db.Column(db.String(1000), nullable=True)
    # Relationship to data tables
    espi = db.relationship("Espi", backref="sources", lazy=True)
    __table_args__ = (db.UniqueConstraint("friendly_name", "user_id"),)

    def save_to_db(self) -> None:
        """Add the account to the TABLE sources."""
        db.session.add(self)
        db.session.commit()

    @classmethod
    def delete(cls, user, friendly_name) -> dict:
        """Delete the user's source where friendly_name=friendly_name"""
        try:
            source = (
                db.session.query(cls)
                .filter_by(friendly_name=friendly_name)
                .with_parent(user)
                .first()
            )
            db.session.query(Espi).filter_by(source_id=source.id).delete()
            db.session.query(cls).filter_by(id=source.id).delete()
            db.session.commit()
            print(f"deleted source_id: {source.id} ")
            return {"message": f"{friendly_name} deleted"}
        except Exception as e:
            db.session.rollback()
            return {"message": f"Something went wrong: {e}"}

    def __repr__(self) -> None:
        return (
            f"id: {self.id}, "
            f"user_id: {self.user_id}, "
            f"friendly_name: {self.friendly_name}"
        )


class Espi(db.Model):
    """Model for ESPI data from Green Button API."""

    id = db.Column(db.Integer, primary_key=True)
    source_id = db.Column(db.Integer, db.ForeignKey("sources.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    watt_hours = db.Column(db.Integer, nullable=False)
    __table_args__ = (db.UniqueConstraint("source_id", "start",),)
