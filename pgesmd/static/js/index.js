import Chart from 'chart.js';
import Moment from 'moment';
import { getEnergyHistory, getPromise, getCompleteData, getDataNow } from './utils.js';

const { Map } = require('immutable');
const { fromJS } = require('immutable');


const initData = fromJS(getDataNow());

function myFunction() {
    var btn = document.createElement("BUTTON");
    btn.innerHTML = "CLICK ME";
    btn.id = "btn";
    document.body.appendChild(btn);
  }

myFunction();

let energyHistory;

getCompleteData()
    .then(data => {
        energyHistory = fromJS(data)

});

console.log(energyHistory);

document.getElementById('btn').addEventListener("click", function () {
    console.log(energyHistory);
})



