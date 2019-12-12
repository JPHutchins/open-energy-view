import React from 'react';
import {Bar} from 'react-chartjs-2';

export default class EnergyChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        {/* <button 
          onClick={this.handleEvening}
          className='btn'
        >
          Evening Only
        </button> */}
        
        <h2>Energy History</h2>
        <Bar data={this.props.data} options={this.props.options} />
      </div>
    );
  }
};
