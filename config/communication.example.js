const CommunicationInterface = require ('../Communication/CommunicationInterface');

class Communication extends CommunicationInterface {
  constructor(opt) {
    super();
    // do some init stuff
  }

  requestTemp() {
    //change this
    this._temperatureUpdate(19.4, new Date(timestamp));

    return true;
  }

  // Heating
  requestHeatingState() {
    //change this
    this._heatingStateUpdate(true); //tell em heating is on
  }

  toggleHeating(state) {
    //set relay ON/OFF
  }

  requestSomeoneIsHome() {
    //maybe change this
    this._someoneIsHomeStatusUpdate(true);
  }

  logState(state) {
    console.log(state);
  }
}


module.exports = new Communication();

