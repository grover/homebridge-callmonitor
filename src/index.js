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

  homebridge.registerPlatform(platformName, platformPrettyName, FritzPlatform, true);
}

const FritzPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log('Fritz Platform Plugin Loaded');
    this.config = config;
    this.api = api;
  }

  accessories(callback) {
    let _accessories = [];
    const { devices } = this.config;

    devices.forEach(bot => {
      this.log(`Found device in config: "${devices.name}"`);

      const callMonitor = new CallMonitorAccessory(this.api.hap, this.log, bot);
      _accessories.push(callMonitor);
    });

    callback(_accessories);
  }
}