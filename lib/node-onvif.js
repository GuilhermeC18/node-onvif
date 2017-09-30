/* ------------------------------------------------------------------
* node-onvif - node-onvif.js
*
* Copyright (c) 2016 - 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-09-30
* ---------------------------------------------------------------- */
'use strict';
const mDgram  = require('dgram');
const mCrypto = require('crypto');

/* ------------------------------------------------------------------
* Constructor: Onvif()
* ---------------------------------------------------------------- */
function Onvif() {
	// Public
	this.OnvifDevice = require('./modules/device.js');
	// Private
	this._OnvifSoap  = require('./modules/soap.js');
	this._MULTICAST_ADDRESS = '239.255.255.250';
	this._PORT = 3702;
	this._udp = null;
	this._devices = {};
	this._DISCOVERY_INTERVAL = 150; // ms
	this._DISCOVERY_RETRY_MAX = 3;
	this._DISCOVERY_WAIT = 3000; // ms
	this._discovery_interval_timer = null;
	this._discovery_wait_timer = null;
}

/* ------------------------------------------------------------------
* Method: startDiscovery(callback)
* [Caution]
*   This method has been depricated.
*   Use the startProbe() method instead of this method.
* ---------------------------------------------------------------- */
Onvif.prototype.startDiscovery = function(callback) {
	this.startProbe().then((list) => {
		let execCallback = () => {
			let d = list.shift();
			if(d) {
				callback(d);
				setTimeout(() => {
					execCallback();
				}, 100);
			}
		}
		execCallback();
	}).catch((error) => {
		callback(error);
	});
};

/* ------------------------------------------------------------------
* Method: startProbe([callback])
* ---------------------------------------------------------------- */
Onvif.prototype.startProbe = function(callback) {
	let promise = new Promise((resolve, reject) => {
		this._devices = {};
		this._udp = mDgram.createSocket('udp4');

		this._udp.once('error', (error) => {
			reject(error);
		});

		this._udp.on('message', (buf, device_info) => {
			this._OnvifSoap.parse(buf.toString()).then((result) => {
				let type = '';
				let urn = '';
				let xaddrs = [];
				let scopes = [];
				let types = '';
				try {
					let probe_matches = result['Body']['ProbeMatches']

					// make sure the right data exists
					if(probe_matches !== undefined) {
						let probe_match = probe_matches['ProbeMatch'];
						urn = probe_match['EndpointReference']['Address'];
						xaddrs = probe_match['XAddrs'].split(/\s+/);
						if(typeof(probe_match['Scopes']) === 'string') {
							scopes = probe_match['Scopes'].split(/\s+/);
						} else if(typeof(probe_match['Scopes']) === 'object' && typeof(probe_match['Scopes']['_']) === 'string') {
							scopes = probe_match['Scopes']['_'].split(/\s+/);
						}
						// modified to support Pelco cameras
						if(typeof(probe_match['Types']) === 'string') {
							types = probe_match['Types'].split(/\s+/);
						} else if(typeof(probe_match['Types']) === 'object' && typeof(probe_match['Types']['_']) === 'string') {
							types = probe_match['Types']['_'].split(/\s+/)
						}							
					}
				} catch(e) {
					return;
				};
				if(urn && xaddrs.length > 0 && scopes.length > 0) {
					if(!this._devices[urn]) {
						let name = '';
						let hardware = '';
						let location = '';
						scopes.forEach((s) => {
							if(s.indexOf('onvif://www.onvif.org/hardware/') === 0) {
								hardware = s.split('/').pop();
							} else if(s.indexOf('onvif://www.onvif.org/location/') === 0) {
								location = s.split('/').pop();
							} else if(s.indexOf('onvif://www.onvif.org/name/') === 0) {
								name = s.split('/').pop();
								name = name.replace(/_/g, ' ');
							}
						});
						let probe = {
							'urn'     : urn,
							'name'    : name,
							'hardware': hardware,
							'location': location,
							'types'   : types,
							'xaddrs'  : xaddrs,
							'scopes'  : scopes
						};
						this._devices[urn] = probe;
					}
				}
			}).catch((error) => {
				// Do nothing.
			});
		});

		this._udp.bind(() => {
			this._udp.removeAllListeners('error');
			this._sendProbe().then(() => {
				// Do nothing.
			}).catch((error) => {
				reject(error);
			});
			this._discovery_wait_timer = setTimeout(() => {
				this.stopProbe().then(() => {
					let device_list = [];
					Object.keys(this._devices).forEach((urn) => {
						device_list.push(this._devices[urn]);
					});
					resolve(device_list);
				}).catch((error) => {
					reject(error);
				});
			}, this._DISCOVERY_WAIT);
		});
	});

	if(this._isValidCallback(callback)) {
		promise.then((device_list) => {
			callback(null, device_list);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

Onvif.prototype._isValidCallback = function(callback) {
	return (callback && typeof(callback) === 'function') ? true : false;
};

Onvif.prototype._execCallback = function(callback, arg1, arg2) {
	if(this._isValidCallback(callback)) {
		callback(arg1, arg2);
	}
};

Onvif.prototype._sendProbe = function(callback) {
	let soap_tmpl = '';
	soap_tmpl += '<?xml version="1.0" encoding="UTF-8"?>';
	soap_tmpl += '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">';
	soap_tmpl += '  <s:Header>';
	soap_tmpl += '    <a:Action s:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</a:Action>';
	soap_tmpl += '    <a:MessageID>uuid:__uuid__</a:MessageID>';
	soap_tmpl += '    <a:ReplyTo>';
	soap_tmpl += '      <a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address>';
	soap_tmpl += '    </a:ReplyTo>';
	soap_tmpl += '    <a:To s:mustUnderstand="1">urn:schemas-xmlsoap-org:ws:2005:04:discovery</a:To>';
	soap_tmpl += '  </s:Header>';
	soap_tmpl += '  <s:Body>';
	soap_tmpl += '    <Probe xmlns="http://schemas.xmlsoap.org/ws/2005/04/discovery">';
	soap_tmpl += '      <d:Types xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery" xmlns:dp0="http://www.onvif.org/ver10/network/wsdl">dp0:__type__</d:Types>';
	soap_tmpl += '    </Probe>';
	soap_tmpl += '  </s:Body>';
	soap_tmpl += '</s:Envelope>';
	soap_tmpl = soap_tmpl.replace(/\>\s+\</g, '><');
	soap_tmpl = soap_tmpl.replace(/\s+/, ' ');

	let soap_set = [];
	['NetworkVideoTransmitter', 'Device', 'NetworkVideoDisplay'].forEach((type) => {
		let s = soap_tmpl;
		s = s.replace('__type__', type);
		s = s.replace('__uuid__', this._createUuidV4());
		soap_set.push(s);
	});

	let soap_list = [];
	for(let i=0; i<this._DISCOVERY_RETRY_MAX; i++) {
		soap_set.forEach((s) => {
			soap_list.push(s);
		});
	}

	let promise = new Promise((resolve, reject) => {
		if (!this._udp) {
			reject(new Error('No UDP connection is available. The init() method might not be called yet.'));
		}
		let send = () => {
			let soap = soap_list.shift();
			if(soap) {
				let buf = Buffer.from(soap, 'utf8');
				this._udp.send(buf, 0, buf.length, this._PORT, this._MULTICAST_ADDRESS, (error, bytes) => {
					this._discovery_interval_timer = setTimeout(() => {
						send();
					}, this._DISCOVERY_INTERVAL);
				});
			} else {
				resolve();
			}
		};
		send();
	});
	return promise;
};

Onvif.prototype._createUuidV4 = function() {
	let clist = mCrypto.randomBytes(16).toString('hex').toLowerCase().split('');
	clist[12] = '4';
	clist[16] = (parseInt(clist[16], 16) & 3 | 8).toString(16);
	let m = clist.join('').match(/^(.{8})(.{4})(.{4})(.{4})(.{12})/);
	let uuid = [m[1], m[2], m[3], m[4], m[5]].join('-');
	this._uuid = uuid;
	return uuid;
};

/* ------------------------------------------------------------------
* Method: stopDiscovery([callback])
* [Caution]
*   This method has been depricated.
*   Use the stopProbe() method instead of this method.
* ---------------------------------------------------------------- */
Onvif.prototype.stopDiscovery = function(callback) {
	this.stopProbe().then(() => {
		this._execCallback(callback);
	}).catch((error) => {
		this._execCallback(callback, error);
	});
};

/* ------------------------------------------------------------------
* Method: stopProbe([callback])
* ---------------------------------------------------------------- */
Onvif.prototype.stopProbe = function(callback) {
	if(this._discovery_interval_timer !== null) {
		clearTimeout(this._discovery_interval_timer);
		this._discovery_interval_timer = null;
	}
	if(this._discovery_wait_timer !== null) {
		clearTimeout(this._discovery_wait_timer);
		this._discovery_wait_timer = null;
	}

	let promise = new Promise((resolve, reject) => {
		if(this._udp) {
			this._udp.close(() => {
				this._udp.unref()
				this._udp = null;
				resolve();
			});
		} else {
			resolve();
		}
	});

	if(this._isValidCallback(callback)) {
		promise.then(() => {
			callback(null);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

module.exports = new Onvif();