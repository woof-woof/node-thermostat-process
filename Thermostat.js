let _comm = require('./config/communication');
let yaml = require('js-yaml');
let fs = require('fs');

class Thermostat {
  constructor() {
    this.desiredTemp = 14;
    this.cTemp = null;
    this.lastTempUpdate = null;
    this.heatingOn = null;
    this.someoneIsHome = true;
    this.comm = _comm;
    this.config = {};

    this.loadConfig();
    this.bindToCommunication();
    this.startRoutines();
  }

/////////////
/// SETUP ///
/////////////
  bindToCommunication() {
    this.comm.events.on('heatingStateChanged', (state) => {
      this.logD('heating is', state);
      this.heatingOn = state;
    });
    this.comm.events.on('temperatureChanged', (temp, lastUpdate) => {
      this.cTemp = temp;
      this.lastTempUpdate = lastUpdate;
      this.logD('temp is', temp, 'updated', lastUpdate);
    });
    this.comm.events.on('someoneIsHomeUpdate', (state) => {
      this.someoneIsHome = state;
    })
  }

  startRoutines() {
    this.requestInfo();
    this._requestInfoIntreval = setInterval(this.requestInfo.bind(this), this.config.readInterval);
    this._keepTempInterval = setInterval(this.keepTemperature.bind(this), this.config.keepTempInterval);
  }



// main temp-keeping routine
  keepTemperature() {
    try {
      this.desiredTemp = this.getDesiredTemperature();
      this.logD(`keepTemp@ ${this.desiredTemp} (${this.currentTempProgramName}), cTemp=${this.cTemp}, heatingOn=${this.heatingOn}, someoneIsHome=${this.someoneIsHome}`);
      if (!this.cTemp) {
        return console.error('Temperature not yet available');
      }
      else if (!this.heatingOn && this.cTemp < this.desiredTemp - this.config.heating.lowThreshold) {
        this.comm.toggleHeating(true);
      }
      else if (this.heatingOn && this.cTemp > this.desiredTemp + this.config.heating.highThreshold) {
        this.comm.toggleHeating(false);
      }
      this.logState();
    }
    catch (err) {
      this.logError(err, "keepTemperature RUN error");
    }
  }



/////////////
/// UTILS ///
/////////////
  loadConfig() {
    this.config = yaml.safeLoad(fs.readFileSync(__dirname + '/config/config.yml', 'utf8'));
  }

  logError(error, title) {
    console.error(title, error);
  }

  logD() {
    console.log(...arguments);
  }

  prettyDate(date) {
    date = date ? new Date(date) : new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  }

  logState() {
    let state = {
      cTemp: this.cTemp,
      lastTempUpdate: this.lastTempUpdate,
      desiredTemp: this.desiredTemp,
      heatingOn: this.heatingOn,
      someoneIsHome: this.someoneIsHome,
      currentTempProgramName: this.currentTempProgramName,
      updatedAt: new Date()
    };
    fs.writeFileSync(__dirname + '/var/state.json', JSON.stringify(state, null, 1));

    this.comm.logState(state);
  }

  requestInfo() {
    this.comm.requestTemp();
    this.comm.requestHeatingState();
    this.comm.requestSomeoneIsHome();
  }

  getDesiredTemperature() {
    this.loadConfig();
    try {
      let programName = this.getActiveProgramName();
      let program = this.config.heating.tempPrograms[programName];
      this.currentTempProgramName = programName;
      if (program.tempIfEmpty && !this.someoneIsHome) {
        return parseFloat(program.tempIfEmpty);
      }
      return parseFloat(program.temp);
    }
    catch (err) {
      this.logError(err, "Failed to get desired temperature");
    }
  }


  getActiveProgramName() {
    let cDate = new Date();
    let weekDay = cDate.getDay();
    let hour = cDate.getHours();
    let minute = cDate.getMinutes();
    let dayProgramKey = this.config.heating.weekProgram[weekDay];
    let dayProgram = this.config.heating.dayPrograms[dayProgramKey];

    //find the active tempProgram in current dayProgram
    let programs = [];
    for (let startTime_c in dayProgram) {
      if (dayProgram.hasOwnProperty(startTime_c)) {
        let startTime = startTime_c.split(':');
        programs.push({
          hour: parseInt(startTime[0]),
          minute: parseInt(startTime[1]),
          name: dayProgram[startTime_c]
        });
      }
    }
    programs.sort( (a, b) => a.hour * 60 + a.minute - b.hour * 60 - b.minute);
    // this.logD('today\'s programs', programs);
    let tempProgramIndex = programs.length - 1;
    for (let i = 0; i < programs.length; i++) {
      if (hour < programs[i].hour || ( hour == programs[i].hour && minute <= programs[i].minute)) {
        tempProgramIndex = i - 1;
        break;
      }
    }
    if (tempProgramIndex < 0) tempProgramIndex = programs.length - 1;
    return programs[tempProgramIndex].name;
  }
}



var thermostat = new Thermostat();
module.exports = thermostat;