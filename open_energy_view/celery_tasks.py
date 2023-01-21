from gevent import monkey

monkey.patch_all()

import time
import requests
import os
from sqlalchemy import exc as SQLiteException

from .celery import celery
from .espi_helpers import parse_espi_data, save_espi_xml
from gevent import sleep

from .helpers import request_url
from . import models
from . import create_app
from . import db
from flask import has_app_context


@celery.task(bind=True, name="insert_espi_xml_into_db")
def insert_espi_xml_into_db(self, xml, given_source_id=None, save=False):
    """Parse and insert the XML into the db."""
    print("CALLED")

    if not has_app_context():
        app = create_app(f"open_energy_view.{os.environ.get('FLASK_CONFIG')}")
        app.app_context().push()

    print(has_app_context())
    if save:
        try:
            save_espi_xml(xml)
        except Exception as e:
            print(e)
            save_espi_xml(xml.decode("utf-8"))
        finally:
            pass
    data_update = []
    source_id_memo = {}
    for start, duration, watt_hours, usage_point in parse_espi_data(xml):
        if usage_point not in source_id_memo:
            if given_source_id:
                source_id_memo[usage_point] = [given_source_id]
            else:
                sources = db.session.query(models.Source).filter_by(
                    usage_point=usage_point
                )
                if sources.count() == 0:
                    print(
                        f"could not find usage point {usage_point} in db, probably gas"
                    )
                    source_id_memo[usage_point] = []
                elif sources.count() > 1:
                    print(f"WARNING: {usage_point} is associated with multiple sources")
                source_id_memo[usage_point] = [source.id for source in sources]
        for source_id in source_id_memo[usage_point]:
            data_update.append(
                {
                    "start": start,
                    "duration": duration,
                    "watt_hours": watt_hours,
                    "source_id": source_id,
                }
            )
    try:
        db.session.bulk_insert_mappings(models.Espi, data_update)
        db.session.commit()
    except SQLiteException.IntegrityError:
        db.session.rollback()
        sql_statement = """
            INSERT OR REPLACE INTO espi (start, duration, watt_hours, source_id)
            VALUES (:start, :duration, :watt_hours, :source_id)
        """
        db.engine.execute(sql_statement, data_update)
    finally:
        timestamp = int(time.time() * 1000)
        for source_ids in source_id_memo.values():
            for source_id in source_ids:
                source_row = db.session.query(models.Source).filter_by(id=source_id)
                source_row.update({"last_update": timestamp})
        db.session.commit()


@celery.task(bind=True, name="process_data")
def process_data(self, inc):
    print(inc)
    time.sleep(15)
    return inc


@celery.task
def add(x, y):
    time.sleep(10)
    return x + y


@celery.task(bind=True, name="get_jp")
def get_jp(self):
    response = requests.get(
        "http://slowwly.robertomurray.co.uk/delay/2500/url/https://www.jphutchins.com"
    )
    return "BOOM"


@celery.task(bind=True, name="fetch_task")
def fetch_task(self, published_period_start, interval_block_url, headers, cert):
    four_weeks = 3600 * 24 * 28
    end = int(time.time())
    published_period_start = int(published_period_start)
    print(published_period_start, interval_block_url, headers, cert)
    while end > published_period_start:
        start = end - four_weeks + 3600
        params = {
            "published-min": start,
            "published-max": end,
        }
        response_text = request_url(
            "GET",
            interval_block_url,
            params=params,
            headers=headers,
            cert=cert,
            format="text",
        )
        save_espi_xml(response_text)
        db_insert_task = insert_espi_xml_into_db.delay(response_text)
        end = start - 3600
        sleep(2)
    retries = 0
    while not db_insert_task.ready():
        if retries > 60:
            print("Insert into DB failed!")
            break
        retries += 1
        sleep(1)
    return "done"


@celery.task(bind=True, name="fake_fetch")
def fake_fetch(self):
    test_xml = [
        "/home/jp/open-energy-view/test/data/espi/espi_2_years.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-16.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-17.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-18.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-19.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-20.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-21.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-22.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-23.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-24.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-25.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-26.xml",
        "/home/jp/open-energy-view/test/data/espi/Single Days/2019-10-27.xml",
    ]
    test_xml.reverse()

    for xml_path in test_xml:
        time.sleep(2.5)
        with open(xml_path) as xml_reader:
            xml = xml_reader.read()
        db_insert_task = insert_espi_xml_into_db.delay(xml)

    retries = 0
    while not db_insert_task.ready():
        if retries > 60:
            break
        retries += 1
        sleep(1)

    return "done"
