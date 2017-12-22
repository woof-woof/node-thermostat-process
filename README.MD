# Node Thermostat
NodeJS thermostat, agnostic of: reading temperature, toggling heating.  
Toggles ON/OFF a heating system, based on temperature readings and schedules settings from configuration files.  

Can be adapted to different methods of reading temperature & toggling heating, by extending the base class `CommunicationInterface` and implementing 4 functions: `requestTemp`, `requestHeatingState`, `requestToggleHeating`, `requestSomeoneIsHome` and optionally log state using `logState`


## Installation & configuration
Run `npm install`

create `config/communication.js` or `config/communication/index.js` appropiate for your environment *(example: https://github.com/andreiciceu/thermostat-dht22-mqtt-communication-interface)*

edit `config/heating.yml` according to your needs *(uses https://github.com/woof-woof/temperature-config-parser, so check it out for configuration details)*

test if running correctly with `node index.js`


### Setup as a service using PM2
https://github.com/Unitech/pm2  
install pm2 process manager with `npm install pm2 -g`  
`pm2 startup` & follow instructions  
`pm2 start index.js --name "thermostat"`  
`pm2 save`  

Check state of processes with `pm2 list`  
Restart with `pm2 restart`  



## Reading status
The current status of the thermostat can be found in `var/state.json` and has the following params
```json
{
 "currentTemperature": <float|int>,
 "desiredTemperature": <float|int>,
 "lastTemperatureUpdate": <ISO_DATE>,
 "currentTemperatureProgramName": <string>,
 "heatingOn": <bool>,
 "someoneIsHome": <bool>,
 "updatedAt": <ISO_DATE>
}
```
