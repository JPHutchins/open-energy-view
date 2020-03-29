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
    max_watt_hour = db.Column(db.Integer, default=0)
    first_entry = db.Column(db.Integer, default=4102444799)
    last_entry = db.Column(db.Integer, default=0)
    n_parts = db.Column(db.Integer, nullable=True)
    part_values = db.Column(db.Integer, nullable=True)
    last_update = db.Column(db.Integer, default=0)
    # Relationship to data tables
    raw = db.relationship("Raw", backref="pgesmd", lazy=True)
    hour = db.relationship("Hour", backref="pgesmd", lazy=True)
    part = db.relationship("Part", backref="pgesmd", lazy=True)
    day = db.relationship("Day", backref="pgesmd", lazy=True)
    week = db.relationship("Week", backref="pgesmd", lazy=True)
    month = db.relationship("Month", backref="pgesmd", lazy=True)
    year = db.relationship("Year", backref="pgesmd", lazy=True)
    daily_passive = db.relationship("DailyPassive", backref="pgesmd", lazy=True)

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


class Raw(db.Model):
    """Model for raw data from PGESMD API that is not hourly."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    watt_hours = db.Column(db.Integer, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start"),)


class Hour(db.Model):
    """Model for hourly data from PGESMD API."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    watt_hours = db.Column(db.Integer, nullable=False)
    # TEMP PATCH FOR OLD SCHEMA
    duration = db.Column(db.Integer, nullable=False)
    end = db.Column(db.Integer, nullable=False)
    middle = db.Column(db.Integer, nullable=False)
    value = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Text, nullable=False)
    part_type = db.Column(db.Integer, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start",),)


class Part(db.Model):
    """Model for partition data from PGESMD API."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    part_avg = db.Column(db.Integer, nullable=False)
    part_sum = db.Column(db.Integer, nullable=False)
    # TEMP PATCH FOR OLD SCHEMA
    end = db.Column(db.Integer, nullable=False)
    middle = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Text, nullable=False)
    part_type = db.Column(db.Integer, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start",),)


class Day(db.Model):
    """Model for daily data from PGESMD API."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    day_avg = db.Column(db.Integer, nullable=False)
    day_sum = db.Column(db.Integer, nullable=False)
    min = db.Column(db.Integer, nullable=False)
    baseline = db.Column(db.Integer, nullable=True)
    # TEMP PATCH FOR OLD SCHEMA
    date = db.Column(db.Text, nullable=False)
    end = db.Column(db.Integer, nullable=False)
    middle = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Text, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start",),)


class Week(db.Model):
    """Model for weekly data from PGESMD API."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    week_avg = db.Column(db.Integer, nullable=False)
    week_sum = db.Column(db.Integer, nullable=False)
    # TEMP PATCH FOR OLD SCHEMA
    end = db.Column(db.Integer, nullable=False)
    middle = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Text, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start",),)


class Month(db.Model):
    """Model for monthly data from PGESMD API."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    month_avg = db.Column(db.Integer, nullable=False)
    month_sum = db.Column(db.Integer, nullable=False)
    # TEMP PATCH FOR OLD SCHEMA
    end = db.Column(db.Integer, nullable=False)
    middle = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Text, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start",),)


class Year(db.Model):
    """Model for yearly data from PGESMD API."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    year_avg = db.Column(db.Integer, nullable=False)
    year_sum = db.Column(db.Integer, nullable=False)
    # TEMP PATCH FOR OLD SCHEMA
    end = db.Column(db.Integer, nullable=False)
    middle = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Text, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start",),)


class DailyPassive(db.Model):
    """Model for the daily passive statistic."""

    id = db.Column(db.Integer, primary_key=True)
    pge_id = db.Column(db.Integer, db.ForeignKey("pgesmd.id"), nullable=False)
    # Data
    start = db.Column(db.Integer, nullable=False)
    watt_hours = db.Column(db.Integer, nullable=False)
    __table_args__ = (db.UniqueConstraint("pge_id", "start",),)


class RevokedToken(db.Model):
    """Model for the revoked tokens (user logout)."""

    __tablename__ = "revoked_tokens"
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(120))

    def add(self):
        """Add the token to the blacklist."""
        db.session.add(self)
        db.session.commit()

    @classmethod
    def is_jti_blacklisted(cls, jti) -> bool:
        """Return True if token is blacklisted, else False."""
        query = cls.query.filter_by(jti=jti).first()
        return bool(query)
