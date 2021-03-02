# Homebridge Plugin to monitor calls

Accessories created by this platform provide a contact sensor, which is opened for every
incoming or outgoing call. A use for this could be to automatically turn down the volume
of played back music to be able to recognize the ringing phone.

Integrates with HomeKit via [Homebridge](https://github.com/nfarina/homebridge).

## Why a Call Monitor Plugin

I have trouble hearing in noisy environments and sometimes fail to notice that my phone
rings. I don't think I'm alone with this.

I configured this plugin to turn down any music that might be playing to enable me to
notice that the phone rings. Another aspect is that the music playback remains turned down
while I am on the phone and is raised as soon as I hang up.

This callmonitor plugin exposes two contact sensors - one for incoming calls and one
for outgoing calls. These enable the separate handling by call direction and the application
of different rules.

## Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

 ```sudo npm install -g homebridge-callmonitor```

## Example config.json

```json
{
  "bridge": {
      ...
  },
  "platforms": [
    {
      "platform": "CallMonitor",
      "devices": [
        {
          "name": "AVM Fritz!Box 7490",
          "address": "192.168.178.1",
          "port": "1012",
          "outgoingName": "Ausgehender Anruf",
          "incomingName": "Eingehender Anruf"
          "incomingLines": ["123456","234567"]
        }
      ]
    }
  ]
}
```

The platform can connect to any number of devices, which support the call monitor protocol supported by AVM Fritz!Box devices. I've tested it with an AVM Fritz!Box 7490, other models may work as well. If you want to report a different
device as working, please file an issue.

A device is configured by specifying the following:

| Attributes | Usage |
|------------|-------|
| name | The name of the device. Must be specified. |
| address | The IPv4 address of the AVM Fritz device. If no address is specified, the accessory will not be created. |
| port | The port where the Fritz device reports call statistic data. This default is 1012. |
| incomingName | The name of the contact sensor service for incoming calls. If not specified this is the name of the device with `- incoming` appended. |
| outgoingName | The name of the contact sensor service for outgoing calls.  If not specified this is the name of the device with `- outgoing` appended. |
| incomingLines | The line numbers a device shall react on. Always use array style or '\*' for no filtering. Optional |


## Accessory Services

Each bot will expose two services:

* Accessory Information Service
* Contact Sensor Service for incoming calls
* Contact Sensor Service for outgoing calls

## Supported clients

This platform and the bots it drives have been verified to work with the following apps on iOS 11

* Elgato Eve
* Home

## Supported devices

* AVM Fritz!Box 7490

Other devices not listed here may work. If you have another device that works, please report
it via a [GitHub](https://github.com/grover/homebridge-callmonitor/issues) issue.

### Configuration

You need to enable the call monitor on most devices. For AVM Fritz!Box devices this can be done by dialing `#96*5*` on a connected phone. To disable the call monitor dial `#96*4*`.

## Some asks for friendly gestures

If you use this and like it - please leave a note by staring this package here or on GitHub.

If you use it and have a problem, file an issue at [GitHub](https://github.com/grover/homebridge-callmonitor/issues) - I'll try to help.

If you tried this, but don't like it: tell me about it in an issue too. I'll try my best
to address these in my spare time.

If you fork this, go ahead - I'll accept pull requests for enhancements.

## License

MIT License

Copyright (c) 2017 Michael Fröhlich

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
