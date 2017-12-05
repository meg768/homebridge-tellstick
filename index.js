const Service, Characteristic;
var state = 0;

console.log('**********************************************');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("switch-plugin", "MyAwesomeSwitch", mySwitch);
};

function debug() {
    console.log.apply(this, arguments);
}

function mySwitch(log, config) {
    this.log = log;
}

mySwitch.prototype = {

    getSwitchOnCharacteristic: function(next) {
        const me = this;
        debug('Returning state', state)
        return next(null, state);
    },

    setSwitchOnCharacteristic: function(on, next) {
        const me = this;
        state = on;
        debug('State is now', state);
        return next();
    },
    getServices: function() {
        let informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "My switch manufacturer")
            .setCharacteristic(Characteristic.Model, "My switch model")
            .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

        let switchService = new Service.Switch("My switch");
        switchService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getSwitchOnCharacteristic.bind(this))
            .on('set', this.setSwitchOnCharacteristic.bind(this));

        this.informationService = informationService;
        this.switchService = switchService;
        return [informationService, switchService];
    }

};
