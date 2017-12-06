"use strict";

var telldus = require('telldus');
var sprintf = require('yow/sprintf');

/*

{ name: 'SR-01',
    id: 17,
    methods: [ 'TURNON', 'TURNOFF', 'LEARN' ],
    model: 'selflearning-switch',
    protocol: 'arctech',
    type: 'DEVICE',
    status: { name: 'ON' } },

    */


var Service, Characteristic;
var devices = undefined;

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

debug('Adding event listener');

telldus.addDeviceEventListener(function(id, status) {

    var device = findDevice(id);

    if (device != undefined) {
        device.status = status;
        console.log('Event:', device);

    } else {
        console.log('Device', id, 'not found.');
    }
});

/*
module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-tellstick", "Tellstick", TelldusSwitch);
};
*/

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerPlatform('homebridge-tellstick', 'Tellstick', TelldusPlatform);

};

class TelldusPlatform {
    constructor(log, config, homebridge) {
        this.log = log
        this.config = config
        this.homebridge = homebridge
    }

    accessories(callback) {
        this.log('Loading devices...');

        var devices = getDevices();
        var list = [];

        devices.forEach((device) => {
            list.push(new TelldusDevice(device));
        });

        callback(list);

    }
}



class TelldusDevice {

    constructor(device) {
        debug(device);
        this.device = device;
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
/*
class TelldusSwitch {

    constructor(log, config) {
        console.log(config);
        this.log = log;
        this.device = getDevice(config.name);
        this.name = config.name;
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
        var self = this;
        var informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, "My switch manufacturer")
            .setCharacteristic(Characteristic.Model, "My switch model")
            .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

        debug('NEW NAME', self.name);
        var switchService = new Service.Switch(self.name);
        switchService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getState.bind(this))
            .on('set', this.setState.bind(this));

        this.informationService = informationService;
        this.switchService = switchService;
        return [informationService, switchService];
    }

};

*/
/*

function mySwitch(log, config) {
    console.log(config);
    this.log    = log;
    this.device = getDevice(config.name);
    this.name   = config.name;
}

mySwitch.prototype = {

    getSwitchOnCharacteristic: function(next) {
        debug('Returning state', this.device);
        return next(null, this.device.status.name == 'ON');
    },

    setSwitchOnCharacteristic: function(on, next) {

        if (on) {
            debug('Turning on', this.device);
            telldus.turnOnSync(this.device.id);
        }
        else {
            debug('Turning off', this.device);
            telldus.turnOffSync(this.device.id);
        }

        return next();
    },

    getServices: function() {
        var self = this;
        var informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, "My switch manufacturer")
            .setCharacteristic(Characteristic.Model, "My switch model")
            .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

        debug('NEW NAME', self.name);
        var switchService = new Service.Switch(self.name);
        switchService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getSwitchOnCharacteristic.bind(this))
            .on('set', this.setSwitchOnCharacteristic.bind(this));

        this.informationService = informationService;
        this.switchService = switchService;
        return [informationService, switchService];
    }

};


*/
