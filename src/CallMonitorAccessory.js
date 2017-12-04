"use strict";

const inherits = require('util').inherits;
const Socket = require('net').Socket;

var Accessory, Characteristic, Service;


class CallMonitorAccessory {

  constructor(homebridge, log, config) {
    Accessory = homebridge.Accessory;
    Characteristic = homebridge.Characteristic;
    Service = homebridge.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;
    this.category = Accessory.Categories.SENSOR;

    this._host = config.address;
    this._port = config.port;

    this._activeConnections = [];
    this._inCall = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    this._active = false;
    this._hasFault = false;

    this._socket = null;
    this._connect();

    this._services = this.createServices();
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this.getContactSensorService()
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Fritz Call Monitor')
      .setCharacteristic(Characteristic.SerialNumber, '42')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  getContactSensorService() {
    const sensor = new Service.ContactSensor(this.name);
    sensor.getCharacteristic(Characteristic.ContactSensorState)
      .on('get', this._getInCall.bind(this));

    sensor.getCharacteristic(Characteristic.StatusActive)
      .on('get', this._getActive.bind(this));

    sensor.getCharacteristic(Characteristic.StatusFault)
      .on('get', this._getFault.bind(this));

    return sensor;
  }
  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _getInCall(callback) {
    this.log("Returning current in call status: s=" + this._inCall);
    callback(undefined, this._inCall);
  }

  _setInCall(value) {
    this._inCall = value ? Characteristic.ContactSensorState.CONTACT_DETECTED : Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;

    this._services[1].getCharacteristic(Characteristic.StatusActive)
      .updateValue(this._inCall, undefined, undefined);
  }

  _getActive(callback) {
    this.log("Returning current active status: s=" + this._active);
    callback(undefined, this._active);
  }

  _setActive(value) {
    this._active = value;

    this._services[1].getCharacteristic(Characteristic.StatusActive)
      .updateValue(this._active, undefined, undefined);
  }

  _getFault(callback) {
    this.log("Returning current fault status: s=" + this._hasFault);
    callback(undefined, this._hasFault ? 1 : 0);
  }

  _setFault(value) {
    this._hasFault = value;

    this._services[1].getCharacteristic(Characteristic.StatusFault)
      .updateValue(this._hasFault, undefined, undefined);
  }

  _connect() {
    this._socket = new Socket();
    this._socket.on('connect', () => {
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
      this._activeConnections.push(data[2]);
    }
    else if (data[1] == 'DISCONNECT') {
      this._activeConnections = this._activeConnections.filter(item => item !== data[2]);
    }

    this._setInCall(this._activeConnections.length > 0);
  }
}

module.exports = CallMonitorAccessory;
