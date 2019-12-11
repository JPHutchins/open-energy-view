# pgesmd
## PG&amp;E Share My Data API for Self Access Users

PG&E makes available an API for all customers to see their hourly energy usage data for free.  The goal of this project is to analyze and present the data to the user in a way that empowers them to conserve electricity and save money.  A detailed guide to registering for Share My Data with PG&E is coming soon.

## Requirements

You will submit to PG&E a valid SSL certificate during the registration process.  I use Let's Encrypt.

Consider that as of now PG&E will require that you are forwarding port 443 to the webserver component that is part of this project.  PG&E's API is asynchronous - this webserver is listening for incoming data from PG&E.

This is only necessary during the initial testing phase of this project - when the project moves to OAuth registration the service will be in the cloud and the end user will not have to worry about this 443/async annoyance.

If you are a PG&E customer and would like get started refer to their guide here:
https://www.pge.com/en_US/residential/save-energy-money/analyze-your-usage/your-usage/view-and-share-your-data-with-smartmeter/reading-the-smartmeter/share-your-data/access-your-own-data.page

## Resources
Green Button and ESPI

https://www.energy.gov/data/green-button

https://green-button.github.io/developers/

http://www.greenbuttondata.org/

https://github.com/GreenButtonAlliance
