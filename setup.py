import setuptools

from distutils.core import setup

setup(
    name="open_energy_view",
    version='0.1dev',
    author='J.P. Hutchins',
    author_email='jphutchins@gmail.com',
    packages=setuptools.find_packages(),
    license='MIT',
    long_description=open('README.md').read()
)
