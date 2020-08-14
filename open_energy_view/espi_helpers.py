import os
from io import StringIO
from xml.etree import cElementTree as ET
from operator import itemgetter
from sqlalchemy import exc as SQLiteException
from time import time


from . import db
from . import models


def parse_espi_data(xml, ns="{http://naesb.org/espi}"):
    """Generate ESPI tuple from ESPI XML.
    Sequentially yields a tuple for each Interval Reading:
        (start, duration, watthours)
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
    for child in root.iter(f"{ns}timePeriod"):
        first_start = int(child.find(f"{ns}start").text)
        duration = int(child.find(f"{ns}duration").text)
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

    # Find all values
    it = map(itemgetter(1), iter(ET.iterparse(xml)))
    for data in it:
        if data.tag == f"{ns}powerOfTenMultiplier":
            mp = int(data.text)
        if data.tag == f"{ns}IntervalBlock":
            for interval in data.findall(f"{ns}IntervalReading"):
                time_period = interval.find(f"{ns}timePeriod")

                duration = int(time_period.find(f"{ns}duration").text)
                start = int(time_period.find(f"{ns}start").text)
                value = int(interval.find(f"{ns}value").text)
                watt_hours = int(round(value * pow(10, mp) * duration / 3600))

                if start == previous[0]:  # clocks back
                    continue

                if not start == previous[0] + duration:  # clocks forward
                    start = previous[0] + duration
                    watt_hours = int((previous[2] + watt_hours) / 2)
                    previous = (start, duration, watt_hours)
                    yield (start, duration, watt_hours)
                    continue

                previous = (start, duration, watt_hours)
                yield (start, duration, watt_hours)

            data.clear()


def insert_espi_xml_into_db(xml, source_id, save=False):
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
    for entry in parse_espi_data(xml):
        data_update.append(
            {
                "source_id": source_id,
                "start": entry[0],
                "duration": entry[1],
                "watt_hours": entry[2],
            }
        )
    try:
        db.session.bulk_insert_mappings(models.Espi, data_update)
        db.session.commit()
    except SQLiteException.IntegrityError:
        db.session.rollback()
        db.engine.execute(
            """INSERT OR IGNORE
               INTO espi (source_id, start, duration, watt_hours)
               VALUES (:source_id, :start, :duration, :watt_hours)""",
            data_update,
        )
    finally:
        timestamp = int(time() * 1000)
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
