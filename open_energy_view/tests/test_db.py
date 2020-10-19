import pytest

# from open_energy_view import models
from open_energy_view import resources


def test_db_empty(client, session):
    assert session.query(resources.models.User).count() == 1
    assert session.query(resources.models.User).first().email == "jph@demo.com"
    assert session.query(resources.models.Source).count() == 0


def test_add_user(client, session):
    new_user = resources.models.User(email="new_user", password="password")
    new_user.save_to_db()
    assert session.query(resources.models.User).count() == 2
    assert session.query(resources.models.User).filter_by(email="new_user").count() == 1
    assert resources.models.User.find_by_email("new_user") == new_user


def test_user_auth(client, session):
    new_user = resources.models.User(
        email="new_user",
        password=resources.bcrypt.generate_password_hash("password").decode("utf-8"),
    )
    new_user.save_to_db()
    user_id = (
        session.query(resources.models.User).filter_by(email="new_user").first().id
    )
    new_user = resources.models.User.find_by_email("new_user")
    assert resources.bcrypt.check_password_hash(new_user.password, "password")


def test_add_source(client, session):
    user_a = resources.models.User(email="user_a", password="password")
    user_a.save_to_db()
    user_a_id = (
        session.query(resources.models.User).filter_by(email="user_a").first().id
    )
    user_b = resources.models.User(email="user_b", password="password")
    user_b.save_to_db()
    user_b_id = (
        session.query(resources.models.User).filter_by(email="user_b").first().id
    )
    new_source = resources.models.Source(
        user_id=user_a_id, friendly_name="new_source", usage_point="1"
    )
    new_source.save_to_db()
    assert (
        session.query(resources.models.Source).filter_by(user_id=user_a_id).count() == 1
    )
    new_source = resources.models.Source(
        user_id=user_a_id, friendly_name="new_source_2", usage_point="2"
    )
    new_source.save_to_db()
    assert (
        session.query(resources.models.Source).filter_by(user_id=user_a_id).count() == 2
    )
    new_source = resources.models.Source(
        user_id=user_b_id, friendly_name="new_source", usage_point="3"
    )
    new_source.save_to_db()
    assert (
        session.query(resources.models.Source).filter_by(user_id=user_b_id).count() == 1
    )
    # Check unique constraints
    with pytest.raises(Exception) as e:
        new_source = resources.models.Source(
            user_id=user_a_id, friendly_name="new_source", usage_point="1"
        )
        new_source.save_to_db()
    assert "IntegrityError" in str(e.value)
    with pytest.raises(Exception) as e:
        new_source = resources.models.Source(
            user_id=user_a_id, friendly_name="new_source_name", usage_point="1"
        )
        new_source.save_to_db()
    assert "IntegrityError" in str(e.value)
    with pytest.raises(Exception) as e:
        new_source = resources.models.Source(
            user_id=user_a_id, friendly_name="new_source", usage_point="20"
        )
        new_source.save_to_db()
    assert "IntegrityError" in str(e.value)
    with pytest.raises(Exception) as e:
        new_source = resources.models.Source(
            user_id=user_b_id, friendly_name="new_source", usage_point="1"
        )
        new_source.save_to_db()
    assert "IntegrityError" in str(e.value)


def test_delete_source(client, session):
    user_a = resources.models.User(email="user_a", password="password")
    user_a.save_to_db()
    user_a_id = (
        session.query(resources.models.User).filter_by(email="user_a").first().id
    )
    new_source = resources.models.Source(
        user_id=user_a_id, friendly_name="new_source", usage_point="1"
    )
    new_source.save_to_db()
    assert 1 == session.query(resources.models.Source).filter_by(user_id=user_a_id).count()
    resources.models.Source.delete(user_a, "new_source")
    assert 0 == session.query(resources.models.Source).filter_by(user_id=user_a_id).count()