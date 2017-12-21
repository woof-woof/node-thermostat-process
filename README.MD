# Node Thermostat
NodeJS thermostat, agnostic of: reading temperature, toggling heating.

## Installation
Run `npm install`

create `config/communication.js` or `config/communication/index.j` appropiate for your environment.
For example, use `https://github.com/andreiciceu/thermostat-dht22-mqtt-communication-interface` for a DHT sensor connected to RaspberryPI

edit heating.yml according to your needs


test if running correctly with `node index.js`

### Setup as a service using PM2
https://github.com/Unitech/pm2
install pm2 process manager with `npm install pm2 -g`
`pm2 startup` & follow instructions
`pm2 start index.js`
`pm2 save`
Check state of processes with `pm2 list`
Restart with `pm2 restart`

## Reading status
The current status of the thermostat can be found in `var/state.json` and has the following params
```
cTemp: <float>
lastTempUpdate: <date|string>
desiredTemp: <float>
heatingOn: <int|bool>
someoneIsHome: <int|bool>
currentTempProgramName: <string>
updatedAt: <date|string>
```