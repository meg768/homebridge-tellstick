var telldus = require('telldus');

var Service, Characteristic;
var state = 0;

console.log('**********************************************');

/*

{
    "bridge": {
        "name": "Homebridge",
        "username": "CC:22:3D:E3:CE:30",
        "port": 51826,
        "pin": "031-45-154"
    },

    "description": "This is an example configuration file with one fake accessory and one fake platform. You can use this as a template for$


        "accessories" : [
          {
            "accessory": "HomebridgeSmappee",
            "name": "Smappee Switch",
            "password": "admin",
            "ip": "192.168.0.10",
            "switch_id": "2"
          },
          {
            "accessory": "Tellstick",
            "name": "Smappee Switch",
            "password": "admin",
            "ip": "192.168.0.10",
            "switch_id": "2"
          }

        ]


}


*/


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
    this.id    = config.id;
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
