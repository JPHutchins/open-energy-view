import Chart from 'chart.js';
import Moment from 'moment';

const { Map } = require('immutable');

const map1 = Map({ a: 1, b: 2});
const map2 = map1.set('b', 50);
console.log(map1.get('b') + " vs. " + map2.get('b'));