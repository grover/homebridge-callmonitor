const version = require('../package.json').version;
const CallMonitorAccessory = require('./CallMonitorAccessory');

const HOMEBRIDGE = {
  Accessory: null,
  Service: null,
  Characteristic: null,
  UUIDGen: null
};

const platformName = 'homebridge-callmonitor';
const platformPrettyName = 'CallMonitor';

module.exports = (homebridge) => {
  HOMEBRIDGE.Accessory = homebridge.platformAccessory;
  HOMEBRIDGE.Service = homebridge.hap.Service;
  HOMEBRIDGE.Characteristic = homebridge.hap.Characteristic;
  HOMEBRIDGE.UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform(platformName, platformPrettyName, CallMonitorPlatform, true);
}

const CallMonitorPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log('CallMonitor Platform Plugin Loaded');
    this.config = config;
    this.api = api;
  }

  accessories(callback) {
    let _accessories = [];
    const { devices } = this.config;

    devices.forEach(device => {
      this.log(`Found device in config: "${device.name}"`);

      if (!device.address || !device.name) {
        this.log('Skipping device because it doesn\'t have an address.');
        return;
      }

      device.port = device.port || 1012;
      device.incomingName = device.incomingName || device.name + " - Incoming";
      device.outgoingName = device.outgoingName || device.name + " - Outgoing";
      device.incomingLines = device.incomingLines || "*";

      const callMonitor = new CallMonitorAccessory(this.api.hap, this.log, device);
      _accessories.push(callMonitor);
    });

    callback(_accessories);
  }
}
