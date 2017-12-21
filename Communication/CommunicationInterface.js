const EventEmitter = require('events');

class CommunicationEmitter extends EventEmitter {}

/**
 * @emit heatingStateChanged(bool state)
 * @emit temperatureChanged(float tempCelsius, [Date timestamp])
 * @emit someoneIsHomeUpdate(bool state) - true if people home, false if empty
 */
class CommunicationInterface {
  /**
   * @IMPLEMENT
   * Request new temp reading
   * @return bool success
   * when new temperature response is available,
   * CALL _temperatureUpdate(float, [timestamp])
   */
  requestTemp() {
    // CHANGE THIS
    this._temperatureUpdate(20, new Date());
  }

  /**
   * @IMPLEMENT
   * Request new heating state reading
   * @return bool success
   * When new heating state is available,
   * CALL _heatingStateUpdate
   */
  requestHeatingState() {
    // IMPLEMENT THIS
  }

  /**
   * @IMPLEMENT
   * Toggle heating on/off
   * When operation finished heatingStateChanged SHOULD BE EMITTED
   * preferably from heating relay messaging this
   */
  requestToggleHeating(state) {
    // IMPLEMENT THIS
  }

  /**
   * @IMPLEMENT
   * Request status update of is someone at home (true), or not (false)
   * CALL _someoneIsHomeStatusUpdate
   */
  requestSomeoneIsHome() {
    // IMPLEMENT THIS
  }

  /**
   * @IMPLEMENT
   * log state to database/file/etc
   */
  logState(state) {
    // maybe IMPLEMENT THIS
  }


  // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
  constructor() {
    this.events = new CommunicationEmitter();
  }

  // ////////////
  //  EVENTS ///
  // ///////////
  _heatingStateUpdate(state) {
    this.events.emit('heatingStateChanged', state);
  }

  _temperatureUpdate(temp, lastUpdate) {
    let retTemp = temp;
    if (typeof temp !== 'number') {
      retTemp = parseFloat(temp);
    }
    this.events.emit('temperatureChanged', retTemp, lastUpdate);
  }

  _someoneIsHomeStatusUpdate(state) {
    this.events.emit('someoneIsHomeUpdate', state);
  }
}

module.exports = CommunicationInterface;