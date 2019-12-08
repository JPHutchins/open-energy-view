import React from "react";
import EnergyChart from "./energyChart"
import { getCompleteData, makeOptions } from '../utils.js';

const { fromJS } = require('immutable');

export default class EnergyHistory extends React.Component {
  constructor(props) {
    super(props);
    this.colors = ['#0000A0', '#add8e6', '#800080'];
    this.state = {
      data: {}
    };
    this.indexReference = {
      hour: 'day',
      part: 'week',
      day: 'month',
      week: 'year',
      month: 'year'
    }
    this.chartSettings = {
      barPercentage: 1.0,
      barThickness: 'flex'
    }
  }

  componentDidMount = () => {
    getCompleteData()
      .then(data => {
        this.database = fromJS(data);
      })
      .then(() => {
        this.setInit();
      })
  }

  setInit = () => {
    const parts = this.database.get('part');
    const weeks = this.database.get('week');

    const lo = weeks.get(weeks.size - 1).get('i_part_start');
    const hi = weeks.get(weeks.size - 1).get('i_part_end');

    const newData = parts.slice(lo - 1, hi);  // this OFF BY ONE is an error and should be corrected in database.py

    const partColors = newData.map(item => 
      this.colors[item.get('part')]
      );

    this.setState({
      data: {
        datasets: [{
          data: newData.toJS(),
          backgroundColor: partColors.toJS(),
          barPercentage: this.chartSettings.barPercentage,
          barThickness: this.chartSettings.barThickness
        }]
      },
      options: makeOptions(newData.toJS()[0]['type'])
    });
  }

  handleScroll = (direction) => {
    const modifyRange = direction === 'previous' ? -1 : 1;

    const currentData = this.state.data.datasets[0].data;
    const type = currentData[0].type;
    const superType = this.indexReference[type];
  
    const dataPoints = this.database.get(type);
    const dataRange = this.database.get(superType);

    const lo = dataRange
                .get(currentData[0]["i_" + superType] + modifyRange)
                .get('i_' + type + '_start');
    const hi = dataRange
                .get(currentData[0]["i_" + superType] + modifyRange)
                .get('i_' + type + '_end');
    const newData = dataPoints.slice(lo, hi);  // this OFF BY ONE is an error and should be corrected in database.py

    const partColors = newData.map(item => 
      this.colors[item.get(type)]
      );

    this.setState({
      data: {
        datasets: [{
          data: newData.toJS(),
          backgroundColor: partColors.toJS(),
          barPercentage: this.chartSettings.barPercentage,
          barThickness: this.chartSettings.barThickness
        }]
      },
      options: makeOptions(type)
    });
  }



  handlePrevious = () => {
    this.handleScroll('previous');
  } 

  handleNext = () => {
    this.handleScroll('next');
  } 

  handleEvening = () => {
    const userColors = ['#0000A0', '#add8e6', '#800080'];
    const newData = this.state.data.datasets[0].data.filter(item => item.part === 0);
    this.setState({
      data: {
        datasets: [{
          data: newData,
          backgroundColor: userColors[0],
          barPercentage: 1.1,
          barThickness: 'flex'
        }]
      },
      i_intvl: 'i_week',
    });
  }

  render () {
    return <div>
            <EnergyChart
            data={this.state.data}
            options={this.state.options}
            colors={this.colors}
            database={this.database} />
          
          <button 
            onClick={this.handlePrevious}
            className='btn'
            style={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            Previous
          </button>
          <button 
            onClick={this.handleNext}
            className='btn'
            style={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            Next
          </button>
          </div>;
  }
}