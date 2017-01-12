/* ------------------------------------------------------------------
* node-onvif - node-onvif.js
*
* Copyright (c) 2016, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2016-12-15
* ---------------------------------------------------------------- */
'use strict';
var mDgram  = require('dgram');
var mXml2Js = require('xml2js');
var mHttp   = require('http');
var mUrl    = require('url');
var mCrypto = require('crypto');

/* ------------------------------------------------------------------
* Constructor: Onvif()
* ---------------------------------------------------------------- */
var Onvif = function() {
	this.MULTICAST_ADDRESS = '239.255.255.250';
	this.PORT = 3702;
	this.udp = null;
	this.uuid = null;
	this.OnvifDevice = require('./modules/device.js');
	this.OnvifSoap   = require('./modules/soap.js');
	this.devices = {};
	this.discovery_interval = 1000; // ms
	this.discovery_timer = null;
	this.discovery_retry_max = 20;
	this.discovery_retry = 0;
};

/* ------------------------------------------------------------------
* Method: startDiscovery(callback)
* ---------------------------------------------------------------- */
Onvif.prototype.startDiscovery = function(callback) {
	this.devices = {};
	this.udp = mDgram.createSocket('udp4');

	this.udp.once('error', (error) => {
		var err = new Error('Failed to initialize the object: ' + error.toString());
		callback(err);
	});

	this.udp.on('message', (buf, device_info) => {
		this.OnvifSoap.parse(buf.toString(), (error, result) => {
			if(error) {
				return;
			}
			var type = '';
			var probe_match = '';
			var urn = '';
			var xaddrs = [];
			var scopes = [];
			try {
				type = result['Body']['ProbeMatches']['ProbeMatch']['Types'];
				probe_match = result['Body']['ProbeMatches']['ProbeMatch'];
				urn = probe_match['EndpointReference']['Address'];
				xaddrs = probe_match['XAddrs'].split(/\s+/);
				scopes = probe_match['Scopes'].split(/\s+/);
			} catch(e) {
				return;
			};
			if(urn && xaddrs.length > 0) {
				if(!this.devices[urn]) {
					var name = '';
					var hardware = '';
					var location = '';
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
					var probe = {
						'urn'     : urn,
						'name'    : name,
						'hardware': hardware,
						'location': location,
						'types'   : probe_match['Types'].split(/\s+/),
						'xaddrs'  : xaddrs,
						'scopes'  : scopes
					};
					this.devices[urn] = probe;
					callback(probe);
				}
			}
		});
	});

	this.udp.bind(0, '0.0.0.0', () => {
		this.udp.removeAllListeners('error');
		this._discoverySendProbe(callback);
	});
};

Onvif.prototype._discoverySendProbe = function(callback) {
	var soap = '';
	soap += '<?xml version="1.0" encoding="UTF-8"?>';
	soap += '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">';
	soap += '  <s:Header>';
	soap += '    <a:Action s:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</a:Action>';
	soap += '    <a:MessageID>' + this._createUuidV4() + '</a:MessageID>';
	soap += '    <a:ReplyTo>';
	soap += '      <a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address>';
	soap += '    </a:ReplyTo>';
	soap += '    <a:To s:mustUnderstand="1">urn:schemas-xmlsoap-org:ws:2005:04:discovery</a:To>';
	soap += '  </s:Header>';
	soap += '  <s:Body>';
	soap += '    <Probe xmlns="http://schemas.xmlsoap.org/ws/2005/04/discovery">';
	soap += '      <d:Types xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery" xmlns:dp0="http://www.onvif.org/ver10/network/wsdl">dp0:NetworkVideoTransmitter</d:Types>';
	soap += '    </Probe>';
	soap += '  </s:Body>';
	soap += '</s:Envelope>';
	soap = soap.replace(/\>\s+\</g, '><');
	soap = soap.replace(/\s+/, ' ');

	var buf = new Buffer(soap, 'utf8');
	if (!this.udp) {
		return;
	}
	this.udp.send(buf, 0, buf.length, this.PORT, this.MULTICAST_ADDRESS, (error, bytes) => {
		this.discovery_retry ++;
		if(this.discovery_retry >= this.discovery_retry_max) {
			this.discovery_retry = 0;
			this.stopDiscovery();
		} else {
			this.discovery_timer = setTimeout(() => {
				this._discoverySendProbe(callback);
			}, this.discovery_interval);
		}
	});
};

Onvif.prototype._createUuidV4 = function() {
	if(this.uuid) {
		return this.uuid;
	} else {
		var clist = mCrypto.randomBytes(16).toString('hex').toLowerCase().split('');
		clist[12] = '4';
		clist[16] = (parseInt(clist[16], 16) & 3 | 8).toString(16);
		var m = clist.join('').match(/^(.{8})(.{4})(.{4})(.{4})(.{12})/);
		var uuid = [m[1], m[2], m[3], m[4], m[5]].join('-');
		return uuid;
	}
};

/* ------------------------------------------------------------------
* Method: stopDiscovery([callback])
* ---------------------------------------------------------------- */
Onvif.prototype.stopDiscovery = function(callback) {
	if(typeof(callback) !== 'function') {
		callback = function() {};
	}
	if(this.discovery_timer !== null) {
		clearTimeout(this.discovery_timer);
		this.discovery_timer = null;
	}
	if(this.udp) {
		this.udp.close(() => {
			this.udp.unref()
			this.udp = null;
			this.discovery_retry = 0;
			callback();
		});
	} else {
		callback();
	}
};

module.exports = new Onvif();