import os

from .espi_helpers import parse_espi_data, insert_espi_xml_into_db

xml_fp = open(f"{os.getcwd()}/1597535437.2658718.xml", "r")
xml = xml_fp.read()
xml_fp.close()

i = 0
days = 0
for entry in parse_espi_data(xml):
    i += 1
    if i % 24 == 0:
        days += 1
        print(entry)
print(i, days)
