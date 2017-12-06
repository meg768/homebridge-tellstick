var telldus = require('telldus');
var sprintf = require('yow/sprintf');

var Service, Characteristic;
var devices = undefined;

function debug() {
    console.log.apply(this, arguments);
}


function findDevice(id) {

    if (devices == undefined) {
        debug('Loading devices');
        devices = telldus.getDevicesSync();
        debug(devices);
    }

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
        console.log(device);

    }
    else {
        console.log('Device', id, 'not found.');
    }
});


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-tellstick", "Tellstick", mySwitch);
};


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
