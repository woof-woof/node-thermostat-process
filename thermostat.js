const communication = require('./config/communication');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const tempConfigParser = require('temperature-config-parser');
const PATHS_CFG = require('./config/paths');


class Thermostat {
  // SETUP
  constructor(runOnlyOnce = true) {
    this.state = {
      currentTemperature: null,
      desiredTemperature: 14,
      lastTemperatureUpdate: null,
      currentTemperatureProgramName: null,
      heatingOn: null,
      someoneIsHome: false,
    };
    this.runOnlyOnce = runOnlyOnce;
    this.comm = communication;
    this.config = {};
    this.loadConfig();
    this.bindCommunication();
    this.startRoutines();
    if (this.runOnlyOnce) this.tryKeepTemperature();
  }

  bindCommunication() {
    this.comm.events.on('heatingStateChanged', (state) => {
      this.state.heatingOn = state;
      this.comm.logDebug('heating is', state);
      if (this.runOnlyOnce) this.tryKeepTemperature();
    });
    this.comm.events.on('temperatureChanged', (temp, lastUpdate) => {
      this.state.currentTemperature = temp;
      this.state.lastTemperatureUpdate = lastUpdate;
      this.comm.logDebug('temp is', temp, 'updated', lastUpdate);
      if (this.runOnlyOnce) this.tryKeepTemperature();
    });
    this.comm.events.on('someoneIsHomeUpdate', (state) => {
      this.state.someoneIsHome = state;
    });
  }

  startRoutines() {
    this.requestInfo();
    if (this.runOnlyOnce) return;

    this._requestInfoIntreval = setInterval(this.requestInfo.bind(this), this.config.readInterval);
    this._keepTempInterval = setInterval(
      this.keepTemperature.bind(this),
      this.config.keepTempInterval,
    );
    setTimeout(this.keepTemperature.bind(this), 60000);
  }
  // END OF SETUP


  loadConfig() {
    this.config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, PATHS_CFG.HEATING_CONFIG), 'utf8'));
  }

  requestInfo() {
    this.comm.requestTemp();
    this.comm.requestHeatingState();
    this.comm.requestSomeoneIsHome();
  }

  getDesiredTemperature() {
    this.loadConfig();
    const res = tempConfigParser.getProgram(this.config.schedule);
    this.state.desiredTemperature = res.temperature;
    this.state.currentTemperatureProgramName = res.programName;

    return res.temperature;
  }

  /**
   * Log state to state file & call communication logState
   */
  logState() {
    const state = { ...this.state, updatedAt: new Date() };
    fs.writeFileSync(path.join(__dirname, PATHS_CFG.STATE), JSON.stringify(state, null, 1));
    this.comm.logState(state);
  }

  /**
   * calls keepTemperature only if currentTemperature & heatingOn are availalbe
   */
  tryKeepTemperature() {
    if (this.state.currentTemperature !== null && this.state.heatingOn !== null) {
      this.keepTemperature();
      if (this.runOnlyOnce) setTimeout(() => this.comm.closeConnections(), 1000);
    }
  }

  // temp-keeping routine
  keepTemperature() {
    try {
      this.state.desiredTemperature = this.getDesiredTemperature();
      this.comm.logDebug(`keepTemp@ ${this.state.desiredTemperature} ` +
        `(${this.state.currentTemperatureProgramName}), ` +
        `cTemp=${this.state.currentTemperature}, ` +
        `heatingOn=${this.state.heatingOn}, ` +
        `someoneIsHome=${this.state.someoneIsHome}`);

      // maintain target temperature
      if (!this.state.currentTemperature) {
        this.comm.logError('Temperature not yet available');
        return;
      } else if (
        !this.state.heatingOn &&
        this.state.currentTemperature < this.state.desiredTemperature - this.config.lowThreshold
      ) {
        this.comm.toggleHeating(true);
      } else if (
        this.state.heatingOn &&
        this.state.currentTemperature > this.state.desiredTemperature + this.config.highThreshold
      ) {
        this.comm.toggleHeating(false);
      }
      this.logState();
    } catch (err) {
      this.comm.logError('keepTemperature RUN error', err);
    }
  }
}


module.exports = Thermostat;
