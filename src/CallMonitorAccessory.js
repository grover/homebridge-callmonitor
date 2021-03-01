"use strict";

const inherits = require('util').inherits;
const Socket = require('net').Socket;
const byline = require('byline');
const createStream = byline.createStream;

var Accessory, Characteristic, Service;


class CallMonitorAccessory {

  constructor(homebridge, log, config) {
    Accessory = homebridge.Accessory;
    Characteristic = homebridge.Characteristic;
    Service = homebridge.Service;

    this.log = log;
    this.name = config.name;
    this.outgoingName = config.outgoingName;
    this.incomingName = config.incomingName;
    this.version = config.version;
    this.category = Accessory.Categories.SENSOR;

    this._host = config.address;
    this._port = config.port;
    this._incomingLines = config.incomingLines;

    this._activeConnections = [];
    this._active = false;
    this._hasFault = false;

    this._socket = null;
    this._connect();


    this.createIncomingCallSensorServices();
    this.createOutgoingCallSensorService();

    this._services = this.createServices();

    this._reportCallStatus();
  }

  createIncomingCallSensorServices() {
    this._incomingCallSensor = new Service.ContactSensor(this.name, "Incoming");
    this._incomingCallSensor.getCharacteristic(Characteristic.ContactSensorState)
      .on('get', this._getIncomingCall.bind(this));

    this._incomingCallSensor.getCharacteristic(Characteristic.StatusActive)
      .on('get', this._getActive.bind(this));

    this._incomingCallSensor.getCharacteristic(Characteristic.StatusFault)
      .on('get', this._getFault.bind(this));

    this._incomingCallSensor.getCharacteristic(Characteristic.Name)
      .setValue(this.incomingName);
  }

  createOutgoingCallSensorService() {
    this._outgoingCallSensor = new Service.ContactSensor(this.name, "Outgoing");
    this._outgoingCallSensor.getCharacteristic(Characteristic.ContactSensorState)
      .on('get', this._getOutgoingCall.bind(this));

    this._outgoingCallSensor.getCharacteristic(Characteristic.StatusActive)
      .on('get', this._getActive.bind(this));

    this._outgoingCallSensor.getCharacteristic(Characteristic.StatusFault)
      .on('get', this._getFault.bind(this));

    this._outgoingCallSensor.getCharacteristic(Characteristic.Name)
      .setValue(this.outgoingName);
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this._incomingCallSensor,
      this._outgoingCallSensor,
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Call Monitor')
      .setCharacteristic(Characteristic.SerialNumber, '42')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  hasIncomingCall() {
    return this.hasCall('RING');
  }

  hasOutgoingCall() {
    return this.hasCall('CALL');
  }

  hasCall(condition) {
    return this._activeConnections.some(call => call.direction === condition) ?
      Characteristic.ContactSensorState.CONTACT_NOT_DETECTED : Characteristic.ContactSensorState.CONTACT_DETECTED;
  }

  _getIncomingCall(callback) {
    const inCall = this.hasIncomingCall();
    this.log("Returning current incoming call status: s=" + inCall);
    callback(undefined, inCall);
  }

  _getOutgoingCall(callback) {
    const outCall = this.hasOutgoingCall();
    this.log("Returning current outgoing call status: s=" + outCall);
    callback(undefined, outCall);
  }

  _reportCallStatus() {

    const incomingCall = this.hasIncomingCall();
    const outgoingCall = this.hasOutgoingCall();

    this._setCallSensorStatus(this._incomingCallSensor, incomingCall);
    this._setCallSensorStatus(this._outgoingCallSensor, outgoingCall);
  }

  _setCallSensorStatus(sensor, status) {
    sensor.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(status, undefined, undefined);
  }

  _getActive(callback) {
    this.log("Returning current active status: s=" + this._active);
    callback(undefined, this._active);
  }

  _setActive(value) {
    this._active = value;

    this._incomingCallSensor.getCharacteristic(Characteristic.StatusActive)
      .updateValue(this._active, undefined, undefined);
    this._outgoingCallSensor.getCharacteristic(Characteristic.StatusActive)
      .updateValue(this._active, undefined, undefined);
  }

  _getFault(callback) {
    this.log("Returning current fault status: s=" + this._hasFault);
    callback(undefined, this._hasFault ? 1 : 0);
  }

  _setFault(value) {
    this._hasFault = value;

    this._incomingCallSensor.getCharacteristic(Characteristic.StatusFault)
      .updateValue(this._hasFault, undefined, undefined);
    this._outgoingCallSensor.getCharacteristic(Characteristic.StatusFault)
      .updateValue(this._hasFault, undefined, undefined);
  }

  _connect() {
    this._socket = new Socket();
    this._socket.on('connect', () => {
      this.log("Connected to " + this.name);

      const reader = createStream(this._socket, { encoding: "utf-8" });
      reader.on("data", line => this._onLineReceived(line));
      this._socket.once("end", () => reader.end());

      this._setActive(true);
      this._setFault(false);

    });
    this._socket.on("error", e => {
      // Will throw an exception if unavailable :(
    });
    this._socket.on("end", () => {
      this._socket.end();
    });
    this._socket.on("close", had_error => {
      this._setActive(false);
      this._setFault(had_error);

      // Initiate reconnects
      this.log(`Socket connection to "${this.name}"  was closed/rejected. Reconnecting in 5s.`);
      setTimeout(this._connect.bind(this), 5000);
    });

    this._socket.connect(this._port, this._host);
  }

  _onLineReceived(line) {
    const data = line.split(';');

    //
    // Transitions:
    //
    // CALL -> CONNECT -> DISCONNECT
    // RING -> CONNECT -> DISCONNECT
    //
    if (data[1] === 'CALL' || data[1] === 'RING') {
      this._activeConnections.push({
        id: data[2],
        line: data[3],
        callerId: data[3],
        direction: data[1]
      });
    }
    else if (data[1] === 'DISCONNECT') {
      this._activeConnections = this._activeConnections.filter(item => item.id !== data[2]);
    }
    if (this._incomingLines.indexOf(data[4]) >= 0 || this._incomingLines[0] === "*" || this._activeConnections.indexOf(data[2]) >=0) {
      this.log(data[1] + " on Line " + data[4] + " by caller " + data[3] + " with incomingLines config " + this._incomingLines);
      this._reportCallStatus();
    }
  }
}

module.exports = CallMonitorAccessory;
