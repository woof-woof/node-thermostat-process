const communication = require('./config/communication');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const tempConfigParser = require('temperature-config-parser');


class Thermostat {
// SETUP
  constructor() {
    this.state = {
      currentTemperature: null,
      desiredTemperature: 14,
      lastTemperatureUpdate: null,
      currentTemperatureProgramName: null,
      heatingOn: false,
      someoneIsHome: false,
    };
    this.comm = communication;
    this.config = {};
    this.loadConfig();
    this.bindToCommunication();
    this.startRoutines();
  }

  bindToCommunication() {
    this.comm.events.on('heatingStateChanged', (state) => {
      Thermostat.logD('heating is', state);
      this.state.heatingOn = state;
    });
    this.comm.events.on('temperatureChanged', (temp, lastUpdate) => {
      this.state.currentTemperature = temp;
      this.state.lastTemperatureUpdate = lastUpdate;
      Thermostat.logD('temp is', temp, 'updated', lastUpdate);
    });
    this.comm.events.on('someoneIsHomeUpdate', (state) => {
      this.state.someoneIsHome = state;
    });
  }

  startRoutines() {
    this.requestInfo();
    this._requestInfoIntreval = setInterval(this.requestInfo.bind(this), this.config.readInterval);
    this._keepTempInterval = setInterval(
      this.keepTemperature.bind(this),
      this.config.keepTempInterval,
    );
  }


  // main temp-keeping routine
  keepTemperature() {
    try {
      this.state.desiredTemperature = this.getDesiredTemperature();
      Thermostat.logD(`keepTemp@ ${this.state.desiredTemperature} ` +
        `(${this.state.currentTemperatureProgramName}), ` +
        `cTemp=${this.state.currentTemperature}, ` +
        `heatingOn=${this.state.heatingOn}, ` +
        `someoneIsHome=${this.state.someoneIsHome}`);

      // maintain target temperature
      if (!this.state.currentTemperature) {
        return console.error('Temperature not yet available');
      } else if (
        !this.state.heatingOn &&
        this.state.currentTemperature < this.state.desiredTemperature - this.config.lowThreshold
      ) {
        this.comm.toggleHeating(true);
      } else if (
        this.state.heatingOn &&
        this.state.currentTemperature > this.state.desiredTemperature + this.config.highThreshold) {
        this.comm.toggleHeating(false);
      }

      this.logState();
    } catch (err) {
      Thermostat.logError(err, 'keepTemperature RUN error');
    }

    return true;
  }


  loadConfig() {
    this.config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '/config/heating.yml'), 'utf8'));
  }

  requestInfo() {
    this.comm.requestTemp();
    this.comm.requestHeatingState();
    this.comm.requestSomeoneIsHome();
  }

  getDesiredTemperature() {
    this.loadConfig();
    const res = tempConfigParser.getProgram(this.config.schedule);
    console.log(res);
    this.state.desiredTemperature = res.temperature;
    this.state.currentTemperatureProgramName = res.programName;

    return res.temperature;
  }

  logState() {
    const state = { ...this.state, updatedAt: Date.now() };
    fs.writeFileSync(path.join(__dirname, '/var/state.json'), JSON.stringify(state, null, 1));
    this.comm.logState(state);
  }


  // //////////
  //  UTILS ///
  // //////////
  static logError(error, title) {
    console.error(title, error);
  }

  static logD(...args) {
    console.log(...args);
  }
}


module.exports = new Thermostat();
