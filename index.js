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

    constructor(homebridge, device) {
        debug(device);
        this.device = device;
        this.homebridge = homebridge;
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

    setState(value, callback) {

        if (value) {
            debug('Turning on', this.device.name);

            telldus.turnOn(this.device.id, (error) => {
                callback(error);
            });
        } else {
            debug('Turning off', this.device.name);

            telldus.turnOff(this.device.id, (error) => {
                callback(error);
            });
        }
    }

    getServices() {
        var Service = this.homebridge.hap.Service;
        var Characteristic = this.homebridge.hap.Characteristic;

        var info = new Service.AccessoryInformation();

        info.setCharacteristic(Characteristic.Manufacturer, this.device.protocol);
        info.setCharacteristic(Characteristic.Model, this.device.model);
        info.setCharacteristic(Characteristic.SerialNumber, "123-456-789");

        var service = new Service.Lightbulb(this.device.name);

        service.getCharacteristic(Characteristic.On);
        service.on('get', this.getState.bind(this))
        service.on('set', this.setState.bind(this));

        debug('NEW NAME', this.device.name);

        return [info, service];
    }

};
