"use strict";

var telldus = require('telldus');
var sprintf = require('yow/sprintf');
var devices = undefined;

/*

{ name: 'SR-01',
    id: 17,
    methods: [ 'TURNON', 'TURNOFF', 'LEARN' ],
    model: 'selflearning-switch',
    protocol: 'arctech',
    type: 'DEVICE',
    status: { name: 'ON' } },

*/



function debug() {
    console.log.apply(this, arguments);
}


function getDevices() {
    if (devices == undefined) {
        devices = telldus.getDevicesSync();
        debug(devices);
    }
    return devices;
}


function findDevice(id) {

    var devices = getDevices();

    for (var i = 0; i < devices.length; i++) {
        var device = devices[i];

        if (id == device.id)
            return device;

        if (id == device.name) {
            return device;
        }
    };
}

function getDevice(id) {

    var device = findDevice(id);

    if (device == undefined)
        throw new Error(sprintf('Device %s not defined.', id));
    else
        return device;
}

telldus.addDeviceEventListener(function(id, status) {

    var device = findDevice(id);

    if (device != undefined) {
        device.status = status;
        console.log('Event:', device);

    } else {
        console.log('Device', id, 'not found.');
    }
});



module.exports = function(homebridge) {
    homebridge.registerPlatform('homebridge-tellstick', 'Tellstick', TelldusPlatform);

};

class TelldusPlatform {
    constructor(log, config, homebridge) {

        this.log = log;
        this.config = config;
        this.homebridge = homebridge;
    }

    accessories(callback) {
        this.log('Loading devices...');

        var devices = getDevices();
        var list = [];

        devices.forEach((device) => {
            if (device.type.toUpperCase() == 'DEVICE')
                list.push(new TelldusDevice(this.homebridge, device));
        });

        callback(list);

    }
}



class TelldusDevice {

    constructor(homebrige, device) {
        debug(device);
        this.device = device;
        this.homebrige = homebrige;
        this.name = device.name;
    }

    identify(callback) {
      debug('Identify called.');
      callback();
    }

    getState(callback) {
        debug('Returning state', this.device);
        return callback(null, this.device.status.name == 'ON');
    }

    setState(on, callback) {

        if (on) {
            debug('Turning on', this.device);
            telldus.turnOnSync(this.device.id);
        } else {
            debug('Turning off', this.device);
            telldus.turnOffSync(this.device.id);
        }

        return callback();
    }

    getServices() {
        var Service = this.homebridge.hap.Service;
        var Characteristic = this.homebridge.hap.Characteristic;
        var informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, this.device.protocol)
            .setCharacteristic(Characteristic.Model, this.device.model)
            .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

        debug('NEW NAME', this.name);
        var switchService = new Service.Switch(this.name);
        switchService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getState.bind(this))
            .on('set', this.setState.bind(this));

        this.informationService = informationService;
        this.switchService = switchService;
        return [informationService, switchService];
    }

};
