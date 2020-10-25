# Open Energy View

The goal of this project is to analyze and present resource consumption data to users empowering them to conserve and save money. 

## Open Beta!

https://www.openenergyview.com

If you are a PG&E customer you can link your account now!  If you are not a PG&E customer you can try the demo and talk to J.P. about integrating your utility.

## User Interface

![Interface](/docs/open-energy-view-dashboard.PNG)

## Design

![Design](/docs/PGESMD_sketch_full.png)

## Data Analysis

### Averages
Data is presented always by Watt hour (Wh).  This is so that the user can compare different time intervals to one another.  It is not meaningful to compare 630,000 Watts consumed in the month of June to 30,000 Watts consumed last Tuesday.  Rather, we would like to understand the intensity of usage (average) of different time intervals. Usefully, we can see that the average 1,250 Watt hours consumed last Tuesday is higher than the average 875 Watt hours consumed during June.

### Partitions
A partition is a time interval that recurs each day.  The default partitions are:
- Night: 12AM -> 7AM
- Day: 7AM -> 6PM
- Evening: 6PM -> 12AM

These partitions allow the user to develop conclusions about what activities are using the most resources.

### Passive Consumption
Passive consumption is the amount of a resource a building will use even when no person is actively utilizing the energy.  This is calculated statistically using a rolling mean and rolling standard deviation.  This passive consumption metric can account for an outsized amount of electricity utilized in a building since it is by definition always consuming energy.

Presentation of this very useful metric allows users to understand the impact of passive appliances on their resource consumption as well as empowers them to find and disable devices that they do not need 24/7.

#### Activies Pie Chart
The activities pie chart shows the user how much power each activity consumed over the current time window.

### Trends
Various trends are calculated to give the user realtime feedback on their resource conservation efforts.
#### Seasonal Trend
This tend shows about how much power the user is using during this "time of the year" this year vs this "time of the year" last year.  The time range is +/- 14 days to attempt to mitigate the impact of statistical outliers like unseasonably hot or cold weather.
#### Active Use Trend
This trend shows the active use trend up to this point.
Examples of active use:
- Appliances
- TVs
- Computers
- Lighting
#### Background (Passive) Trend
This trend shows the passive used trend up to this point.
Examples of passive use:
- Network Equipment
- Security Systems
- HVAC
- IoT devices
####
## Resources
Green Button and ESPI

https://www.energy.gov/data/green-button

https://green-button.github.io/developers/

http://www.greenbuttondata.org/

https://github.com/GreenButtonAlliance

https://github.com/JPHutchins/pgesmd_self_access
