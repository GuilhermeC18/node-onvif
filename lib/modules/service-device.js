/* ------------------------------------------------------------------
* node-onvif - service-device.js
*
* Copyright (c) 2016, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2016-10-02
* ---------------------------------------------------------------- */
'use strict';
var mUrl    = require('url');

var mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
* Constructor: OnvifServiceDevice(params)
* - params:
*    - xaddr   : URL of the entry point for the device management service
*                (Required)
*    - user  : User name (Optional)
*    - pass  : Password (Optional)
* ---------------------------------------------------------------- */
var OnvifServiceDevice = function(params) {
	this.xaddr = '';
	this.user = '';
	this.pass = '';

	var err_msg = '';

	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		throw new Error('The value of "params" was invalid: ' + err_msg);
	}

	if('xaddr' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['xaddr'], 'string')) {
			throw new Error('The "xaddr" property was invalid: ' + err_msg);
		} else {
			this.xaddr = params['xaddr'];
		}
	} else {
		throw new Error('The "xaddr" property is required.');
	}

	if('user' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['user'], 'string', true)) {
			throw new Error('The "user" property was invalid: ' + err_msg);
		} else {
			this.user = params['user'] || '';
		}
	}

	if('pass' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['pass'], 'string', true)) {
			throw new Error('The "pass" property was invalid: ' + err_msg);
		} else {
			this.pass = params['pass'] || '';
		}
	}

	this.oxaddr = mUrl.parse(this.xaddr);
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	}

	this.time_diff = 0;
	this.name_space_attr_list = [
		'xmlns:tds="http://www.onvif.org/ver10/device/wsdl"',
		'xmlns:tt="http://www.onvif.org/ver10/schema"'
	];
};

OnvifServiceDevice.prototype._createRequestSoap = function(body) {
	var soap = mOnvifSoap.createRequestSoap({
		'body': body,
		'xmlns': this.name_space_attr_list,
		'diff': this.time_diff,
		'user': this.user,
		'pass': this.pass
	});
	return soap;
};

/* ------------------------------------------------------------------
* Method: setAuth(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getTimeDiff = function() {
	return this.time_diff;
};

/* ------------------------------------------------------------------
* Method: setAuth(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setAuth = function(user, pass) {
	this.user = user || '';
	this.pass = pass || '';
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	} else {
		this.oxaddr.auth = '';
	}
};

/* ------------------------------------------------------------------
* Method: getCapabilities(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getCapabilities = function(callback) {
	var soap_body = '';
	soap_body += '<tds:GetCapabilities>';
	soap_body += '  <tds:Category>All</tds:Category>';
	soap_body += '</tds:GetCapabilities>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetCapabilities', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getWsdlUrl(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getWsdlUrl = function(callback) {
	var soap_body = '<tds:GetWsdlUrl/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetWsdlUrl', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getDiscoveryMode(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getDiscoveryMode = function(callback) {
	var soap_body = '<tds:GetDiscoveryMode/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetDiscoveryMode', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getScopes(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getScopes = function(callback) {
	var soap_body = '<tds:GetScopes/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetScopes', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setScopes(params, callback)
* - params:
*   - Scopes  | Array  | required | a list of URI
*
* {
*   'Scopes': [
*     'onvif://www.onvif.org/location/town/Nerima',
*     'onvif://www.onvif.org/location/city/Tokyo'
*   ]
* }
*
* If you want to delete all Configurable scopes, specify an empty
* Array object as the `Scope` property.
*
* {'Scopes': []}
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setScopes = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	var scope_list = params['Scopes'];
	if(err_msg = mOnvifSoap.isInvalidValue(scope_list, 'array', true)) {
		callback(new Error('The "Scopes" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<tds:SetScopes>';
	scope_list.forEach((s) => {
		soap_body += '<tds:Scopes>' + s + '</tds:Scopes>';
	});
	soap_body += '</tds:SetScopes>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SetScopes', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: addScopes(params, callback)
* - params:
*   - Scopes  | Array  | required | a list of URI
*
* {
*   'Scopes': [
*     'onvif://www.onvif.org/location/town/Nerima',
*     'onvif://www.onvif.org/location/city/Tokyo'
*   ]
* }
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.addScopes = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	var scope_list = params['Scopes'];
	if(err_msg = mOnvifSoap.isInvalidValue(scope_list, 'array', true)) {
		callback(new Error('The "Scopes" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<tds:AddScopes>';
	scope_list.forEach((s) => {
		soap_body += '<tds:ScopeItem>' + s + '</tds:ScopeItem>';
	});
	soap_body += '</tds:AddScopes>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'AddScopes', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: removeScopes(params, callback)
* - params:
*   - Scopes  | Array  | required | a list of URI
*
* {
*   'Scopes': [
*     'onvif://www.onvif.org/location/town/Nerima',
*     'onvif://www.onvif.org/location/city/Tokyo'
*   ]
* }
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.removeScopes = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	var scope_list = params['Scopes'];
	if(err_msg = mOnvifSoap.isInvalidValue(scope_list, 'array')) {
		callback(new Error('The "Scopes" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<tds:RemoveScopes>';
	scope_list.forEach((s) => {
		soap_body += '<tds:ScopeItem>' + s + '</tds:ScopeItem>';
	});
	soap_body += '</tds:RemoveScopes>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'RemoveScopes', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getHostname(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getHostname = function(callback) {
	var soap_body = '<tds:GetHostname/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetHostname', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setHostname(params, callback)
* - params:
*   - Name  | string  | required | a host name
*
* {'Name': 'test'}
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setHostname = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	var hostname = params['Name'];
	if(err_msg = mOnvifSoap.isInvalidValue(hostname, 'string')) {
		callback(new Error('The "Name" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<tds:SetHostname>';
	soap_body += '<tds:Name>' + hostname + '</tds:Name>';
	soap_body += '</tds:SetHostname>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SetHostname', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getDNS(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getDNS = function(callback) {
	var soap_body = '<tds:GetDNS/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetDNS', soap, (error, result) => {
		if(!error) {
			try {
				var di = result['data']['DNSInformation'];
				if(!di['SearchDomain']) {
					di['SearchDomain'] = [];
				} else if(!Array.isArray(di['SearchDomain'])) {
					di['SearchDomain'] = [di['SearchDomain']];
				}
				if(!di['DNSManual']) {
					di['DNSManual'] = [];
				} else if(!Array.isArray(di['DNSManual'])) {
					di['DNSManual'] = [di['DNSManual']];
				}
				result['data'] = di;
			} catch(e) {}
		}
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setDNS(params, callback)
* - params:
*   - FromDHCP      | boolean | required | true or false
*   - SearchDomain  | Array   | optional | a list of search domains
*   - DNSManual     | Array   | optional | a list of DNS addresses
*     - Type        | String  | required | "IPv4" or "IPv6"
*     - IPv4Address | String  | optional | IPv4 address
*     - IPv6Address | String  | optional | IPv6 address
*
* {
*   'FromDHCP'    : false,
*   'SearchDomain': ['futomi.gr.jp', 'hatano.gr.jp'],
*   'DNSManual'   : [
*     {'Type': 'IPv4', 'IPv4Address': '192.168.10.1'},
*     {'Type': 'IPv4', 'IPv4Address': '192.168.10.2'}
*   ]
* }
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setDNS = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['FromDHCP'], 'boolean')) {
		callback(new Error('The "FromDHCP" property was invalid: ' + err_msg));
		return;
	}

	if('SearchDomain' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['SearchDomain'], 'array', true)) {
			callback(new Error('The "SearchDomain" property was invalid: ' + err_msg));
			return;
		}
		for(var i=0; i<params['SearchDomain']; i++) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['SearchDomain'][i], 'string')) {
				callback(new Error('The "SearchDomain" property was invalid: ' + err_msg));
				return;
			}
		}
	}

	if('DNSManual' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['DNSManual'], 'array', true)) {
			callback(new Error('The "DNSManual" property was invalid: ' + err_msg));
			return;
		}

		for(var i=0; i<params['DNSManual'].length; i++) {
			var o = params['DNSManual'][i];
			if(err_msg = mOnvifSoap.isInvalidValue(o, 'object')) {
				callback(new Error('The "DNSManual" property was invalid: ' + err_msg));
				return;
			}

			var type = o['Type'];
			if(err_msg = mOnvifSoap.isInvalidValue(type, 'string')) {
				callback(new Error('The "Type" property was invalid: ' + err_msg));
				return;
			} else if(!type.match(/^(IPv4|IPv6)$/)) {
				callback(new Error('The "Type" property was invalid: The value must be either "IPv4" or "IPv6".'));
				return;
			}

			if(type === 'IPv4') {
				if(err_msg = mOnvifSoap.isInvalidValue(o['IPv4Address'], 'string')) {
					callback(new Error('The "IPv4Address" property was invalid: ' + err_msg));
					return;
				}
			} else if(type === 'IPv6') {
				if(err_msg = mOnvifSoap.isInvalidValue(o['IPv6Address'], 'string')) {
					callback(new Error('The "IPv6Address" property was invalid: ' + err_msg));
					return;
				}
			}
		}
	}

	var soap_body = '';
	soap_body += '<tds:SetDNS>';
	if('FromDHCP' in params) {
		soap_body += '<tds:FromDHCP>' + params['FromDHCP'] + '</tds:FromDHCP>';
	}
	if('SearchDomain' in params) {
		params['SearchDomain'].forEach((s) => {
			soap_body += '<tds:SearchDomain>' + s + '</tds:SearchDomain>';
		});
	}
	if('DNSManual' in params) {
		if(params['DNSManual'].length === 0) {
			soap_body += '<tds:DNSManual></tds:DNSManual>';
		} else {
			params['DNSManual'].forEach((o) => {
				soap_body += '<tds:DNSManual>';
				soap_body += '<tt:Type>' + o['Type'] + '</tt:Type>';
				if(o['Type'] === 'IPv4') {
					soap_body += '<tt:IPv4Address>' + o['IPv4Address'] + '</tt:IPv4Address>';
				} else {
					soap_body += '<tt:IPv6Address>' + o['IPv6Address'] + '</tt:IPv6Address>';
				}
				soap_body += '</tds:DNSManual>';
			});
		}
	}
	soap_body += '</tds:SetDNS>';

	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SetDNS', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getNetworkInterfaces(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getNetworkInterfaces = function(callback) {
	var soap_body = '<tds:GetNetworkInterfaces/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetNetworkInterfaces', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getNetworkProtocols(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getNetworkProtocols = function(callback) {
	var soap_body = '<tds:GetNetworkProtocols/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetNetworkProtocols', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setNetworkProtocols(params, callback)
* - params:
*   - NetworkProtocols | Array   | required | a list of protocols
*     - Name           | String  | required |
*     - Enabled        | Boolean | optional |
*     - Port           | Integer | optional |
*
* {
*   'NetworkProtocols': [
*     {'Name': 'HTTP', 'Enabled': true, 'Port': 80},
*     {'Name': 'RTSP', 'Enabled': false, 'Port': 554},
*   ]
* }
*
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setNetworkProtocols = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['NetworkProtocols'], 'array', true)) {
		callback(new Error('The "NetworkProtocols" property was invalid: ' + err_msg));
		return;
	}

	for(var i=0; i<params['NetworkProtocols'].length; i++) {
		var o = params['NetworkProtocols'][i];
		if(err_msg = mOnvifSoap.isInvalidValue(o, 'object')) {
			callback(new Error('The "NetworkProtocols" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(o['Name'], 'string')) {
			callback(new Error('The "Name" property was invalid: ' + err_msg));
			return;
		} else if(!o['Name'].match(/^(HTTP|HTTPS|RTSP)$/)) {
			callback(new Error('The "Name" property was invalid: It must be "HTTP", "HTTPS", or "RTSP".'));
			return;
		}

		var flag = false;

		if('Enabled' in o) {
			if(err_msg = mOnvifSoap.isInvalidValue(o['Enabled'], 'boolean')) {
				callback(new Error('The "Enabled" property was invalid: ' + err_msg));
				return;
			}
			flag = true;
		}

		if('Port' in o) {
			if(err_msg = mOnvifSoap.isInvalidValue(o['Port'], 'integer')) {
				callback(new Error('The "Port" property was invalid: ' + err_msg));
				return;
			}
			flag = true;
		}

		if(flag === false) {
			callbackError('Either "Enabled" or "Port" property is required.');
			return;
		}
	}

	var soap_body = '';
	soap_body += '<tds:SetNetworkProtocols>';
	params['NetworkProtocols'].forEach((o) => {
		soap_body += '<tds:NetworkProtocols>';
		for(var k in o) {
			if(k.match(/^(Name|Enabled|Port)$/)) {
				soap_body += '<tt:' + k + '>' + o[k] + '</tt:' + k + '>';
			}
		}
		soap_body += '</tds:NetworkProtocols>';
	});
	soap_body += '</tds:SetNetworkProtocols>';
	var soap = this._createRequestSoap(soap_body);
	mOnvifSoap.requestCommand(this.oxaddr, 'SetNetworkProtocols', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getNetworkDefaultGateway(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getNetworkDefaultGateway = function(callback) {
	var soap_body = '<tds:GetNetworkDefaultGateway/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetNetworkDefaultGateway', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setNetworkDefaultGateway(params, callback)
* - params:
*   - NetworkGateway | Array | required | a list of IP addresses of gateways
*
* {
*   'NetworkGateway': [
*     {'IPv4Address': '192.168.10.1'},
*     {'IPv4Address': '192.168.10.2'}
*   ]
* }
*
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setNetworkDefaultGateway = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['NetworkGateway'], 'array', true)) {
		callback(new Error('The "NetworkGateway" property was invalid: ' + err_msg));
		return;
	}

	for(var i=0; i<params['NetworkGateway'].length; i++) {
		var o = params['NetworkGateway'][i];
		if('IPv4Address' in o) {
			if(err_msg = mOnvifSoap.isInvalidValue(o['IPv4Address'], 'string')) {
				callback(new Error('The "IPv4Address" property was invalid: ' + err_msg));
				return;
			}
		}
		if('IPv6Address' in o) {
			if(err_msg = mOnvifSoap.isInvalidValue(o['IPv6Address'], 'string')) {
				callback(new Error('The "IPv6Address" property was invalid: ' + err_msg));
				return;
			}
		}
		if(!('IPv4Address' in o) && !('IPv6Address' in o)) {
			callback(new Error('Either "IPv4Address" or "IPv6Address" property must be specified.'));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<tds:SetNetworkDefaultGateway>';
	params['NetworkGateway'].forEach((o) => {
		for(var k in o) {
			if(k.match(/^(IPv4Address|IPv6Address)$/)) {
				soap_body += '<tds:' + k + '>' + o[k] + '</tds:' + k + '>';
			}
		}
	});
	soap_body += '</tds:SetNetworkDefaultGateway>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SetNetworkDefaultGateway', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getDeviceInformation(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getDeviceInformation = function(callback) {
	var soap_body = '<tds:GetDeviceInformation/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetDeviceInformation', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getSystemDateAndTime(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getSystemDateAndTime = function(callback) {
	var soap_body = '<tds:GetSystemDateAndTime/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetSystemDateAndTime', soap, (error, result) => {
		if(!error) {
			var parsed = this._parseGetSystemDateAndTime(result['converted']);
			if(parsed && parsed['date']) {
				var device_time = parsed['date'].getTime();
				var my_time = (new Date()).getTime();
				this.time_diff = device_time - my_time;
			}
		}
		callback(error, result);
	});
};

OnvifServiceDevice.prototype._parseGetSystemDateAndTime = function(s) {
	var s0 = s['Body'];
	if(!s0) {return null;}
	var s1 = s0['GetSystemDateAndTimeResponse'];
	if(!s1) {return null;}
	var s2 = s1['SystemDateAndTime'];
	if(!s2) {return null;}

	var type = s2['DateTimeType'] || '';
	var dst = null;
	if(s2['DaylightSavings']) {
		dst = (s2['DaylightSavings'] === 'true') ? true : false;
	}
	var tz = (s2['TimeZone'] && s2['TimeZone']['TZ']) ? s2['TimeZone']['TZ'] : '';
	var date = null;
	if(s2['UTCDateTime']) {
		var udt = s2['UTCDateTime'];
		var t = udt['Time'];
		var d = udt['Date'];
		if(t && d && t['Hour'] && t['Minute'] && t['Second'] && d['Year'] && d['Month'] && d['Day']) {
			date = new Date();
			date.setUTCFullYear(parseInt(d['Year'], 10));
			date.setUTCMonth(parseInt(d['Month'], 10) - 1);
			date.setUTCDate(parseInt(d['Day'], 10));
			date.setUTCHours(parseInt(t['Hour'], 10));
			date.setUTCMinutes(parseInt(t['Minute'], 10));
			date.setUTCSeconds(parseInt(t['Second'], 10));
		}
	}
	var res = {
		'type': type,
		'dst' : dst,
		'tz'  : tz,
		'date': date
	};
	return res;
};

/* ------------------------------------------------------------------
* Method: setSystemDateAndTime(params, callback)
* - params:
*   - DateTimeType    | string  | required | "NTP" or "Manual".
*   - DaylightSavings | boolean | required | true or false.
*   - TimeZone        | string  | optional | e.g., "EST5EDT", "GMT0", "JST-9".
*   - UTCDateTime     | Date    | optional | A Date object of ECMAScript.
*
* Setting the "UTCDateTime" does not work well for now.
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setSystemDateAndTime = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['DateTimeType'], 'string')) {
		callback(new Error('The "DateTimeType" property was invalid: ' + err_msg));
		return;
	} else if(!params['DateTimeType'].match(/^(NTP|Manual)$/)) {
		callback(new Error('The "DateTimeType" property must be either "NTP" or "Manual".'));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['DaylightSavings'], 'boolean')) {
		callback(new Error('The "DaylightSavings" property was invalid: ' + err_msg));
		return;
	}

	if('TimeZone' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['TimeZone'], 'string')) {
			callback(new Error('The "TimeZone" property was invalid: ' + err_msg));
			return;
		} else if(!params['TimeZone'].match(/^[A-Z]{3}\-?\d{1,2}([A-Z]{3,4})?$/)) {
			callback(new Error('The "TimeZone" property must be a string representing a time zone which is defined in POSIX 1003.1.'));
			return;
		}
	}

	if('UTCDateTime' in params) {
		var v = params['UTCDateTime'];
		if(!v instanceof Date) {
			callback(new Error('The "UTCDateTime" property must be a Date object of ECMAScript.'));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<tds:SetSystemDateAndTime>';
	soap_body += '<tds:DateTimeType>' + params['DateTimeType'] + '</tds:DateTimeType>';
	soap_body += '<tds:DaylightSavings>' + params['DaylightSavings'] + '</tds:DaylightSavings>';
	if(params['TimeZone']) {
		soap_body += '<tds:TimeZone>';
		soap_body +=   '<tt:TZ>' + params['TimeZone'] + '</tt:TZ>';
		soap_body += '</tds:TimeZone>';
	}
	if(params['UTCDateTime']) {
		var dt = params['UTCDateTime'];
		soap_body += '<tds:UTCDateTime>';
		soap_body +=   '<tt:Time>';
		soap_body +=     '<tt:Hour>' + dt.getUTCHours() + '</tt:Hour>';
		soap_body +=     '<tt:Minute>' + dt.getUTCMinutes() + '</tt:Minute>';
		soap_body +=     '<tt:Second>' + dt.getUTCSeconds() + '</tt:Second>';
		soap_body +=   '</tt:Time>';
		soap_body +=   '<tt:Date>';
		soap_body +=     '<tt:Year>' + dt.getUTCFullYear() + '</tt:Year>';
		soap_body +=     '<tt:Month>' + (dt.getUTCMonth() + 1) + '</tt:Month>';
		soap_body +=     '<tt:Day>' + dt.getUTCDate() + '</tt:Day>';
		soap_body +=   '</tt:Date>';
		soap_body += '</tds:UTCDateTime>';
	}
	soap_body += '</tds:SetSystemDateAndTime>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SetSystemDateAndTime', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: reboot(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.reboot = function(callback) {
	if(typeof(callback) !== 'function') {
		callback = function() {};
	}

	var soap_body = '<tds:SystemReboot/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SystemReboot', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getUsers(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getUsers = function(callback) {
	var soap_body = '<tds:GetUsers/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetUsers', soap, (error, result) => {
		if(!error) {
			try {
				var d = result['data']['GetUsersResponse']['User'];
				if(!Array.isArray(d)) {
					result['data']['GetUsersResponse']['User'] = [d];
				}
			} catch(e) {}
			callback(error, result);
		}
	});
};

/* ------------------------------------------------------------------
* Method: createUsers(params, callback)
* - params:
*   - User        | Array  | required |
*     - Username  | string | required | Username
*     - Password  | string | required | Password
*     - UserLevel | string | required | Either "Administrator", "Operator", "User", or "Anonymous"
*
* {
*   'User' : [
*     {'Username': 'test1', 'Password' : 'password', 'UserLevel': 'Administrator'},
*     {'Username': 'test2', 'Password' : 'password', 'UserLevel': 'Operator'},
*     {'Username': 'test3', 'Password' : 'password', 'UserLevel': 'User'}
*   ]
* }
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.createUsers = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['User'], 'array')) {
		callback(new Error('The "User" property was invalid: ' + err_msg));
		return;
	}

	for(var i=0; i<params['User'].length; i++) {
		var u = params['User'][i];
		if(err_msg = mOnvifSoap.isInvalidValue(u, 'object')) {
			callback(new Error('The "User" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(u['Username'], 'string')) {
			callback(new Error('The "Username" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(u['Password'], 'string')) {
			callback(new Error('The "Password" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(u['UserLevel'], 'string')) {
			callback(new Error('The "UserLevel" property was invalid: ' + err_msg));
			return;
		} else if(!u['UserLevel'].match(/^(Administrator|Operator|User|Anonymous)$/)) {
			callback(new Error('The "UserLevel" property must be either "Administrator", "Operator", "User", or "Anonymous".'));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<tds:CreateUsers>';
	params['User'].forEach((u) => {
		soap_body += '<tds:User>';
		soap_body += '<tt:Username>' + u['Username'] + '</tt:Username>';
		soap_body += '<tt:Password>' + u['Password'] + '</tt:Password>';
		soap_body += '<tt:UserLevel>' + u['UserLevel'] + '</tt:UserLevel>';
		soap_body += '</tds:User>';
	});
	soap_body += '</tds:CreateUsers>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'CreateUsers', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: deleteUsers(params, callback)
* - params:
*   - User        | Array  | required |
*     - Username  | string | required | Username
*
* {
*   'User' : [
*     {'Username': 'test1'},
*     {'Username': 'test2'},
*     {'Username': 'test3'}
*   ]
* }
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.deleteUsers = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['User'], 'array')) {
		callback(new Error('The "User" property was invalid: ' + err_msg));
		return;
	}

	for(var i=0; i<params['User'].length; i++) {
		var u = params['User'][i];
		if(err_msg = mOnvifSoap.isInvalidValue(u, 'object')) {
			callback(new Error('The "User" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(u['Username'], 'string')) {
			callback(new Error('The "Username" property was invalid: ' + err_msg));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<tds:DeleteUsers>';
	params['User'].forEach((u) => {
		//soap_body += '<tds:User>';
		soap_body += '<tt:Username>' + u['Username'] + '</tt:Username>';
		//soap_body += '</tds:User>';
	});
	soap_body += '</tds:DeleteUsers>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'DeleteUsers', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setUser(params, callback)
* - params:
*   - User        | Array  | required |
*     - Username  | string | required | Username
*     - Password  | string | optional | Password
*     - UserLevel | string | optional | Either "Administrator", "Operator", "User", or "Anonymous"
*
* {
*   'User' : [
*     {'Username': 'test1', 'Password' : 'password', 'UserLevel': 'Administrator'},
*     {'Username': 'test2', 'Password' : 'password', 'UserLevel': 'Operator'},
*     {'Username': 'test3', 'Password' : 'password', 'UserLevel': 'User'}
*   ]
* }
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setUser = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['User'], 'array')) {
		callback(new Error('The "User" property was invalid: ' + err_msg));
		return;
	}

	for(var i=0; i<params['User'].length; i++) {
		var u = params['User'][i];
		if(err_msg = mOnvifSoap.isInvalidValue(u, 'object')) {
			callback(new Error('The "User" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(u['Username'], 'string')) {
			callback(new Error('The "Username" property was invalid: ' + err_msg));
			return;
		}

		if('Password' in u) {
			if(err_msg = mOnvifSoap.isInvalidValue(u['Password'], 'string')) {
				callback(new Error('The "Password" property was invalid: ' + err_msg));
				return;
			}
		}

		if('UserLevel' in u) {
			if(err_msg = mOnvifSoap.isInvalidValue(u['UserLevel'], 'string')) {
				callback(new Error('The "UserLevel" property was invalid: ' + err_msg));
				return;
			} else if(!u['UserLevel'].match(/^(Administrator|Operator|User|Anonymous)$/)) {
				callback(new Error('The "UserLevel" property must be either "Administrator", "Operator", "User", or "Anonymous".'));
				return;
			}
		}
	}

	var soap_body = '';
	soap_body += '<tds:SetUser>';
	params['User'].forEach((u) => {
		soap_body += '<tds:User>';
		soap_body += '<tt:Username>' + u['Username'] + '</tt:Username>';
		if('Password' in u) {
			soap_body += '<tt:Password>' + u['Password'] + '</tt:Password>';
		}
		if('UserLevel' in u) {
			soap_body += '<tt:UserLevel>' + u['UserLevel'] + '</tt:UserLevel>';
		}
		soap_body += '</tds:User>';
	});
	soap_body += '</tds:SetUser>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SetUser', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getRelayOutputs(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getRelayOutputs = function(callback) {
	var soap_body = '<tds:GetRelayOutputs/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetRelayOutputs', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getNTP(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getNTP = function(callback) {
	var soap_body = '<tds:GetNTP/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetNTP', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setNTP(params, callback)
* - params:
*   - FromDHCP      | Boolean | required | true or false
*   - NTPManual     | Object  | optional |
*     - Type        | String  | required | "IPv4" or "IPv6"
*     - IPv4Address | String  | required | IP address
*
* {
*    "FromDHCP": "false",
*    "NTPManual": {"Type": "IPv4", "IPv4Address": "192.168.10.1"}
* }
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setNTP = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['FromDHCP'], 'boolean')) {
		callback(new Error('The "FromDHCP" property was invalid: ' + err_msg));
		return;
	}

	if('NTPManual' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['NTPManual'], 'object')) {
			callback(new Error('The "NTPManual" property was invalid: ' + err_msg));
			return;
		}

		var o = params['NTPManual'];

		var type = o['Type'];
		if(err_msg = mOnvifSoap.isInvalidValue(type, 'string')) {
			callback(new Error('The "Type" property was invalid: ' + err_msg));
			return;
		} else if(!type.match(/^(IPv4|IPv6)$/)) {
			callback(new Error('The "Type" property was invalid: The value must be either "IPv4" or "IPv6".'));
			return;
		}

		if(type === 'IPv4') {
			if(err_msg = mOnvifSoap.isInvalidValue(o['IPv4Address'], 'string')) {
				callback(new Error('The "IPv4Address" property was invalid: ' + err_msg));
				return;
			}
		} else if(type === 'IPv6') {
			if(err_msg = mOnvifSoap.isInvalidValue(o['IPv6Address'], 'string')) {
				callback(new Error('The "IPv6Address" property was invalid: ' + err_msg));
				return;
			}
		}
	}

	var soap_body = '';
	soap_body += '<tds:SetNTP>';
	soap_body += '<tds:FromDHCP>' + params['FromDHCP'] + '</tds:FromDHCP>';
	if('NTPManual' in params) {
		var o = params['NTPManual'];
		soap_body += '<tds:NTPManual>';
		soap_body += '<tt:Type>' + o['Type'] + '</tt:Type>';
		if(o['Type'] === 'IPv4') {
			soap_body += '<tt:IPv4Address>' + o['IPv4Address'] + '</tt:IPv4Address>';
		} else {
			soap_body += '<tt:IPv6Address>' + o['IPv6Address'] + '</tt:IPv6Address>';
		}
		soap_body += '</tds:NTPManual>';
	}
	soap_body += '</tds:SetNTP>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SetNTP', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getDynamicDNS(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getDynamicDNS = function(callback) {
	var soap_body = '<tds:GetDynamicDNS/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetDynamicDNS', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getZeroConfiguration(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getZeroConfiguration = function(callback) {
	var soap_body = '<tds:GetZeroConfiguration/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetZeroConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getIPAddressFilter(callback)
* No devcie I own supports this method for now.
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getIPAddressFilter = function(callback) {
	var soap_body = '<tds:GetIPAddressFilter/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetIPAddressFilter', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setIPAddressFilter(params, callback)
* - params:
*   - Type:          | String  | required | 'Allow', 'Deny' 
*   - IPv4Address    | Array   | required | 
*     - Address      | String  | required | IPv4 address
*     - PrefixLength | Integer | required | Prefix/submask length
*
* {
*    "Type": "Allow",
*    "IPv4Address": [
*      {
*        "Address": "192.168.10.3",
*        "PrefixLength": 24
*      }
*    ]
* ]}
*
* No devcie I own supports this method for now.
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.setIPAddressFilter = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['Type'], 'string')) {
		callback(new Error('The "Type" property was invalid: ' + err_msg));
		return;
	} else if(!params['Type'].match(/^(Allow|Deny)$/)) {
		callback(new Error('The "Type" property was invalid: The value must be either "Allow" or "Deny".'));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['IPv4Address'], 'array')) {
		callback(new Error('The "IPv4Address" property was invalid: ' + err_msg));
		return;
	}

	for(var i=0; i<params['IPv4Address'].length; i++) {
		var o = params['IPv4Address'][i];
		if(err_msg = mOnvifSoap.isInvalidValue(o, 'object')) {
			callback(new Error('The "IPv4Address" property was invalid: ' + err_msg));
			return;
		}
		if(err_msg = mOnvifSoap.isInvalidValue(o['Address'], 'string')) {
			callback(new Error('The "Address" property was invalid: ' + err_msg));
			return;
		} else if(!o['Address'].match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
			callback(new Error('The "Address" property was invalid as a IPv4 address.'));
			return;
		}
		if(err_msg = mOnvifSoap.isInvalidValue(o['PrefixLength'], 'integer')) {
			callback(new Error('The "PrefixLength" property was invalid: ' + err_msg));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<tds:SetIPAddressFilter>';
	soap_body += '<tds:IPAddressFilter>';
	soap_body += '<tt:Type>' + params['Type'] + '</tt:Type>';
	params['IPv4Address'].forEach((o) => {
		soap_body += '<tt:IPv4Address>';
		soap_body += '<tt:Address>' + o['Address'] + '</tt:Address>';
		soap_body += '<tt:PrefixLength>' + o['PrefixLength'] + '</tt:PrefixLength>';
		soap_body += '</tt:IPv4Address>';
	});
	soap_body += '</tds:IPAddressFilter>';
	soap_body += '</tds:SetIPAddressFilter>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'SetIPAddressFilter', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getServices(params, callback)
* - params:
*   - IncludeCapability | boolean | required | true or false
*
* {'IncludeCapability': false}
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getServices = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['IncludeCapability'], 'boolean')) {
		callback(new Error('The "IncludeCapability" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<tds:GetServices>';
	soap_body += '<tds:IncludeCapability>' + params['IncludeCapability'] + '</tds:IncludeCapability>';
	soap_body += '</tds:GetServices>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetServices', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getServiceCapabilities(callback)
* ---------------------------------------------------------------- */
OnvifServiceDevice.prototype.getServiceCapabilities = function(callback) {
	var soap_body = '<tds:GetServiceCapabilities/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetServiceCapabilities', soap, (error, result) => {
		callback(error, result);
	});
};

module.exports = OnvifServiceDevice;