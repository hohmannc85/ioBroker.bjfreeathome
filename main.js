'use strict';
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/*
 * Created with @iobroker/create-adapter v1.26.3
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const axios = require("axios").default;
const WebSocket = require("ws");
var sysAP_ident;

 

class Bjfreeathome extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'bjfreeathome',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.ws = null;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // Reset the connection indicator during startup
        this.setState('info.connection', false, true);
        
        
        if (!this.config.serverip) {
            this.log.error(`No host is configured, will not start anything!`);
            return;
        }
        
        this.connectWS()
    }
    
isaInteger(str) {
  if (typeof str !== 'string') {
    return false;
  }

  const num = Number(str);

  if (Number.isInteger(num)) {
    return true;
  }

  return false;
}
    
async Dataset(datenpunkt,inhalt)
    {
        let statetyp;
        if (this.isaInteger(inhalt)) { 
                statetyp = "number"; 
                inhalt = parseInt(inhalt); } 
            else {
                statetyp = "string";
        
                
                                                    }
  
        
      await this.setObjectNotExistsAsync(datenpunkt, {
            type: 'state',
            common: {
                name: datenpunkt,
                type: statetyp,
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });  
      
      await this.setStateAsync(datenpunkt, { val: inhalt, ack: true } );
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.setState('info.connection', false, true);
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            
            if (state.ack == false) { 
             this.sendDevicestate(id, state);
             this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);}
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === 'object' && obj.message) {
    //         if (obj.command === 'send') {
    //             // e.g. send email or pushover or whatever
    //             this.log.info('send command');

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    //         }
    //     }
    // }
            
            
/*
*/

    async connectWS() {
     
       
        this.log.debug("Connect to WebSocket");
        try {
          
            this.ws = new WebSocket("ws://"
                                    + this.config.username
                                    + ":"
                                    + this.config.password
                                    +"@"
                                    + this.config.serverip
                                    +"/fhapi/v1/api/ws", {
                headers: "",
            });
            
        } catch (error) {
            this.log.error(error);
            this.log.error("No WebSocketConnection possible");
        }

        this.ws.on("open", () => {
            this.log.info("WebSocket connected");
            this.setState("info.connection", true, true);
            this.loadDevices() 

            
        });
        this.ws.on("error", (data) => {
            this.log.error("WS error:" + data);

            this.setState("info.connection", false, true);
            
        });
        this.ws.on("close", (data) => {
            this.log.debug(data);

            this.setState("info.connection", false, true);
            this.log.info("Websocket closed");
        });    
       
        
        this.ws.on("message", async (data) => {  
         //this.log.info(data);
           
            for (const [key_1, obj_1] of Object.entries(JSON.parse(data))) {
                //"00000000-0000-0000-0000-000000000000"
                
                for (const [key_2, obj_2] of Object.entries(obj_1)) {
                    //this.log.info(JSON.stringify(key_2));
                    
                    if (JSON.stringify(key_2).includes('datapoints'))
                        for (const [key_3, obj_3] of Object.entries(obj_2))     {
                                let varname = JSON.stringify(key_3).replace(/[/]/g,".").replace(/["]/g, "");
                                this.log.info("Status empfangen: " + varname + "=>"  + JSON.stringify(obj_3));
                            
                                let inhalt = JSON.stringify(obj_3).replace(/["]/g, "");
                                if (this.isaInteger(inhalt)) inhalt = parseInt(inhalt);
                                await this.setStateAsync(varname, { val: inhalt  , ack: true } );   
                                   
                                                                                }
                                                                    }
            
                                                                             }; 
            
            
        }); 
        
      }   
    
sendDevicestate(deviceid,devicestate) {
    
    var new_deviceid;
    var count;
    const str_laenge = deviceid.length 
    
    count = 0;
    
    for (var i = 1; i < str_laenge; ++i) {
        if (deviceid[i] == ".") count++;
        
            if (count == 1)
            new_deviceid = deviceid.substring(i+2)
        
        }
                          
    
     this.log.info('http://'+this.config.serverip+'/fhapi/v1/api/rest/datapoint/'+ sysAP_ident + '/' + new_deviceid)

    
    axios({
                method: "put",
                url: 'http://'+this.config.serverip+'/fhapi/v1/api/rest/datapoint/'+ sysAP_ident + '/' + new_deviceid, 
                data: JSON.stringify(devicestate.val).replace(/["]/g, ""),
            
                //followAllRedirects: true,
                //rejectUnhauthorized : false, 
                auth: {
                    username: this.config.username,
                    password: this.config.password
                     },
                }).then((response) => {
                        this.log.info(JSON.stringify(response.data));
    
    }, (error) => { this.log.info(error); }) 
    
  }
    
  loadDevices() {
       axios({
                method: "get",
                url: 'http://'+this.config.serverip+'/fhapi/v1/api/rest/configuration',
            
            
                //followAllRedirects: true,
                rejectUnhauthorized : false, 
                
            
                auth: {
                    username: this.config.username,
                    password: this.config.password
                     },
                }).then((response) => {
      
                    var fh_devices_data = response.data;
           
                    //this.log.info(JSON.stringify(fb_devices_data[1]));
                    
                    for (const [key, obj] of Object.entries(fh_devices_data))
                        {
                            sysAP_ident = JSON.stringify(key).replace(/["]/g, "");
                            //this.log.info(JSON.stringify(key));
                            //00000000-0000-0000-0000-000000000000
                                for (const [key_sub1, obj_sub1] of Object.entries(obj)) {
                                
                                 //this.log.info(JSON.stringify(key_sub1));
                                 //connectionState, sysapName, devices, device_copies, floorplan, users
                                     if (JSON.stringify(key_sub1).includes('devices'))                                     
                                        for (const [key_sub2, obj_sub2] of Object.entries(obj_sub1)) {
                                              //  this.log.info(JSON.stringify(key_sub2)); //devices
                                            for (const [key_sub3, obj_sub3] of Object.entries(obj_sub2)) {
                                                   //channels, displayName, rooms, floor
                                                    //this.log.info(JSON.stringify(key_sub3));
                                                        
                                                      if (JSON.stringify(key_sub3).includes('channels'))  
                                                        for (const [key_sub4, obj_sub4] of Object.entries(obj_sub3)) {
                                                           //channels
                                                            //this.log.info(JSON.stringify(key_sub4));
                                                                    for (const [key_sub4, obj_sub4] of Object.entries(obj_sub3)) {
                                                                        //channelnamen
                                                                        for (const [key_sub5, obj_sub5] of Object.entries(obj_sub4)) {
                                                                        //channelnamen
                                                                            if (JSON.stringify(key_sub5).includes('inputs') ||
                                                                                JSON.stringify(key_sub5).includes('outputs')) { 
                                                                                for (const [key_sub6, obj_sub6] of Object.entries(obj_sub5)) {
                                                                                    
    
                                                                                    
                                                                                    let varname = JSON.stringify(key_sub2) +
                                                                                      '.'+ JSON.stringify(key_sub4)+
                                                                                      '.'+ JSON.stringify(key_sub6);
                                                                                        
                                                                                        varname = varname.replace(/["]/g, "");
                                                                                    
                                                                                        //this.log.info(varname);
                                                                                    
                                                                                     this.Dataset(varname, obj_sub6.value.replace(/["]/g,''));  
                                                                                                                             
                                                                                    
                                                                                                                                            }
                                                                                                                                 } else {
                                                                                                                                     
                                                                                                                                     
                                                                                      let otherstates = JSON.stringify(key_sub2) +
                                                                                      '.'+ JSON.stringify(key_sub4)+
                                                                                      '.'+ JSON.stringify(key_sub5);
                                                                                        
                                                                                        otherstates = otherstates.replace(/["]/g, "");
                                                                                        this.Dataset(otherstates, obj_sub5.value);  
                                                                                        //this.Dataset(otherstates, obj_sub5.replace(/["]/g, ""));  
                                                                                                                                     
                                                                                                                                 }
                                                                                                                                     
                                                                                
                                                                                                                                    }

                                                                                                                                }

                                                                                                                    }
                                                
                                                                                                         }
                                            
                                                                                                }  
                                    
                                    
                                    
                                                                                        }
                            
                            
                        }
           

           
                        
                  this.subscribeStates('*');      
                    })
            
                }
    
            
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Bjfreeathome(options);
} else {
    // otherwise start the instance directly
    new Bjfreeathome();
}
