import os

from .espi_helpers import parse_espi_data

xml_fp = open(f"{os.getcwd()}/1597468468.5072196.xml", "r")
xml = xml_fp.read()
xml_fp.close()

for entry in parse_espi_data(xml):
    print(entry)