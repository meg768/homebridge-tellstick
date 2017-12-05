var telldus = require('telldus');
var sprintf = require('yow/sprintf');

var Service, Characteristic;
var devices = undefined;


function findDevice(id) {

    if (devices == undefined)
	   devices = telldus.getDevicesSync();

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
		throw new Error(sprintf('Device %s not defined.', id.toString()));
	else
		return device;
}



module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-tellstick", "Tellstick", mySwitch);
};

function debug() {
    console.log.apply(this, arguments);
}

function mySwitch(log, config) {
    this.log   = log;
    this.name  = config.name;
    this.id    = getDevice(config.device).id;
    this.name  = sprintf('%s - %s', config.location, config.description);
    this.state = 0;
}

mySwitch.prototype = {

    getSwitchOnCharacteristic: function(next) {
        var self = this;
        debug('Returning state', self.id, self.state);

        return next(null, self.state);
    },

    setSwitchOnCharacteristic: function(on, next) {
        var self = this;
        self.state = on ? 1 : 0;

        if (self.state)
            telldus.turnOnSync(self.id);
        else
            telldus.turnOffSync(self.id);

        debug('State is now', self.id, self.state);
        return next();
    },

    getServices: function() {
        var self = this;
        var informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, "My switch manufacturer")
            .setCharacteristic(Characteristic.Model, "My switch model")
            .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

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
