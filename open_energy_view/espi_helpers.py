import os
import re
from io import StringIO
from xml.etree import cElementTree as ET
from operator import itemgetter
from sqlalchemy import exc as SQLiteException
from time import time


from . import db
from . import models


def parse_espi_data(
    xml, ns0="{http://naesb.org/espi}", ns1="{http://www.w3.org/2005/Atom}"
):
    """Generate ESPI tuple from ESPI XML.
    Sequentially yields a tuple for each Interval Reading:
        (start, duration, watthours, source_id)
    The transition from Daylight Savings Time to Daylight Standard
    Time or inverse are ignored as follows:
    - If the "clocks are set back" then a UTC data point is repeated.  The
        repetition is ignored in order to maintain 24 hours per day.
    - If the "clocks are set forward" then a UTC data point is missing.  The
        missing hour is filled with the average of the previous and following
        values in order to maintain 24 hours per day.
    """

    # Find initial values
    try:
        root = ET.fromstring(xml)
    except Exception as e:
        print(e, xml)
        return
    first_start = None
    for child in root.iter(f"{ns0}timePeriod"):
        first_start = int(child.find(f"{ns0}start").text)
        duration = int(child.find(f"{ns0}duration").text)
        break
    if not first_start:
        print(f"Could not find a first_start in XML: {xml}")
        return
    if not duration:
        print(f"Could not find a duration in XML: {xml}")
        return
    previous = (first_start - duration, 0, 0)
    root.clear()

    xml = StringIO(xml)
    mp = -3
    usage_point = None

    # Find all values
    it = map(itemgetter(1), iter(ET.iterparse(xml)))
    for data in it:
        if data.tag == f"{ns0}powerOfTenMultiplier":
            mp = int(data.text)

        if data.tag == f"{ns1}link":
            href = data.attrib.get("href")
            if not href:
                continue
            if group := re.search(r"(?<=UsagePoint/)\d+", href):
                usage_point = group[0]

        if usage_point and data.tag == f"{ns0}IntervalBlock":
            previous = None
            if block_interval := data.find(f"{ns0}interval"):
                if block_start := block_interval.find(f"{ns0}start"):
                    previous = (int(block_start.text) - duration, duration, 0)

            for interval in data.findall(f"{ns0}IntervalReading"):
                time_period = interval.find(f"{ns0}timePeriod")

                duration = int(time_period.find(f"{ns0}duration").text)
                start = int(time_period.find(f"{ns0}start").text)
                value = int(interval.find(f"{ns0}value").text)
                watt_hours = int(round(value * pow(10, mp) * duration / 3600))

                if previous and start == previous[0]:  # clocks back
                    continue

                if previous and not start == previous[0] + duration:  # clocks forward
                    start = previous[0] + duration
                    watt_hours = int((previous[2] + watt_hours) / 2)
                    previous = (start, duration, watt_hours)
                    yield (start, duration, watt_hours, usage_point)
                    continue

                previous = (start, duration, watt_hours)
                yield (start, duration, watt_hours, usage_point)

            usage_point = None
            data.clear()


def insert_espi_xml_into_db(xml, save=False):
    """Parse and insert the XML into the db."""
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
            sources = db.session.query(models.Source).filter_by(usage_point=usage_point)
            if sources.count() == 0:
                print(f"could not find usage point {usage_point} in db, probably gas")
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
        db.engine.execute(
            """INSERT OR IGNORE
               INTO espi (start, duration, watt_hours, source_id)
               VALUES (:start, :duration, :watt_hours, :source_id)""",
            data_update,
        )
    finally:
        timestamp = int(time() * 1000)
        for source_ids in source_id_memo.values():
            for source_id in source_ids:
                source_row = db.session.query(models.Source).filter_by(id=source_id)
                source_row.update({"last_update": timestamp})
        db.session.commit()


def save_espi_xml(xml_data, filename=None):
    """Save ESPI XML to a file named by timestamp or filename key."""
    if filename:
        save_name = f"{os.getcwd()}/{filename}.xml"
    else:
        save_name = f"{os.getcwd()}/{time()}.xml"

    print(save_name)

    with open(save_name, "w") as file:
        file.write(xml_data)
    return save_name
