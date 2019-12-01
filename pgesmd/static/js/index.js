import Chart from 'chart.js';
import Moment from 'moment';
import { getEnergyHistory, getPromise, getCompleteData, getDataNow } from './utils.js';

const { Map } = require('immutable');
const { fromJS } = require('immutable');


const initData = fromJS(getDataNow());


getCompleteData()
    .then(data => {
        const energyHistory = fromJS(data)

    });

