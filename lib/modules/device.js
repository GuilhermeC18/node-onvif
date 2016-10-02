/* ------------------------------------------------------------------
* node-onvif - device.js
*
* Copyright (c) 2016, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2016-10-02
* ---------------------------------------------------------------- */
'use strict';
var mCrypto = require('crypto');
var mXml2Js = require('xml2js');
var mUrl    = require('url');
var mUtil   = require('util');
var mEventEmitter = require('events').EventEmitter;

var mOnvifServiceDevice = require('./service-device.js');
var mOnvifServiceMedia  = require('./service-media.js');
var mOnvifServicePtz    = require('./service-ptz.js');
var mOnvifServiceEvents = require('./service-events.js');
var mOnvifHttpAuth      = require('./http-auth.js');

/* ------------------------------------------------------------------
* Constructor: OnvifDevice(params)
* - params:
*    - address : IP address of the targeted device
*                (Required if the `xaddr` is not specified)
*    - xaddr   : URL of the entry point for the device management service
*                (Required if the `address' is not specified)
*                If the `xaddr` is specified, the `address` is ignored.
*    - user  : User name (Optional)
*    - pass  : Password (Optional)
* ---------------------------------------------------------------- */
var OnvifDevice = function(params) {
	if(!params || typeof(params) !== 'object') {
		throw new Error('The parameter was invalid.');
	}

	this.address = '';
	this.xaddr = '';
	this.user = '';
	this.pass = '';

	if(('xaddr' in params) && typeof(params['xaddr']) === 'string') {
		this.xaddr = params['xaddr'];
		var ourl = mUrl.parse(this.xaddr);
		this.address = ourl.hostname;
	} else if(('address' in params) && typeof(params['address']) === 'string') {
		this.address = params['address'];
		this.xaddr = 'http://' + this.address +':80/onvif/device_service';
	} else {
		throw new Error('The parameter was invalid.');
	}
	if(('user' in params) && typeof(params['user']) === 'string') {
		this.user = params['user'] || '';
	}
	if(('pass' in params) && typeof(params['pass']) === 'string') {
		this.pass = params['pass'] || '';
	}

	this.oxaddr = mUrl.parse(this.xaddr);
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	}

	this.time_diff = 0;

	this.information = null;
	this.services = {
		'device' : new mOnvifServiceDevice({'xaddr': this.xaddr, 'user': this.user, 'pass': this.pass}),
		'events' : null,
		'imaging': null,
		'media'  : null,
		'ptz'    : null
	};
	this.profile_list = [];

	this.current_profile = null;
	this.ptz_moving = false;

	mEventEmitter.call(this);
};
mUtil.inherits(OnvifDevice, mEventEmitter);

/* ------------------------------------------------------------------
* Method: getInformation()
* ---------------------------------------------------------------- */
OnvifDevice.prototype.getInformation = function() {
	var o = this.information;
	if(o) {
		return JSON.parse(JSON.stringify(o));
	} else {
		return null;
	}
};

/* ------------------------------------------------------------------
* Method: getCurrentProfile()
* ---------------------------------------------------------------- */
OnvifDevice.prototype.getCurrentProfile = function() {
	var o = this.current_profile;
	if(o) {
		return JSON.parse(JSON.stringify(o));
	} else {
		return null;
	}
};

/* ------------------------------------------------------------------
* Method: getProfileList()
* ---------------------------------------------------------------- */
OnvifDevice.prototype.getProfileList = function() {
	return JSON.parse(JSON.stringify(this.profile_list));
};

/* ------------------------------------------------------------------
* Method: changeProfile(index)
* ---------------------------------------------------------------- */
OnvifDevice.prototype.changeProfile = function(index) {
	var p = this.profile_list[index];
	if(p) {
		this.current_profile = p;
		return this.getCurrentProfile();
	} else {
		return null;
	}
};

/* ------------------------------------------------------------------
* Method: getUdpStreamUrl()
* ---------------------------------------------------------------- */
OnvifDevice.prototype.getUdpStreamUrl = function() {
	if(!this.current_profile) {
		return '';
	}
	var url = this.current_profile['stream']['udp'];
	return url ? url : '';
};

/* ------------------------------------------------------------------
* Method: fetchSnapshot()
* ---------------------------------------------------------------- */
OnvifDevice.prototype.fetchSnapshot = function(callback) {
	if(!this.current_profile) {
		callback(new Error('No media profile is selected.'));
		return;
	}
	if(!this.current_profile['snapshot']) {
		callback(new Error('The device does not support snapshot or you have not authorized by the device.'));
		return;
	}
	var ourl = mUrl.parse(this.current_profile['snapshot']);
	var options = {
		protocol: ourl.protocol,
		auth    : this.user + ':' + this.pass,
		hostname: ourl.hostname,
		port    : ourl.port || 80,
		path    : ourl.path,
		method  : 'GET'
	};
	var req = mOnvifHttpAuth.request(options, (res) => {
		var buffer_list = [];
		res.on('data', (buf) => {
			buffer_list.push(buf);
		});
		res.on('end', () => {
			if(res.statusCode === 200) {
				var buffer = Buffer.concat(buffer_list);
				var ct = res.headers['content-type'];
				if(!ct) { // workaround for DBPOWER
					ct = 'image/jpeg';
				}
				if(ct.match(/image\//)) {
					callback(null, {'headers': res.headers, 'body': buffer});
				} else if(ct.match(/^text\//)) {
					callback(new Error(buffer.toString()));
				} else {
					callback(new Error('Unexpected data: ' + ct));
				}
			} else {
				callback(new Error(res.statusCode + ' ' + res.statusMessage));
			}
		});
		req.on('error', (error) => {
			callback(error);
		});
	});
	req.on('error', (error) => {
		callback(error);
	});
	req.end();
};

/* ------------------------------------------------------------------
* Method: ptzMove(params[, callback])
* - params:
*   - speed:
*     - x     | Float   | required | speed for pan (in the range of -1.0 to 1.0)
*     - y     | Float   | required | speed for tilt (in the range of -1.0 to 1.0)
*     - z     | Float   | required | speed for zoom (in the range of -1.0 to 1.0)
*   - timeout | Integer | optional | seconds (Default 1)
* ---------------------------------------------------------------- */
OnvifDevice.prototype.ptzMove = function(params, callback) {
	if(typeof(callback) !== 'function') {
		callback = function() {};
	}
	if(!this.current_profile) {
		callback(new Error('No media profile is selected.'));
		return;
	}
	if(!this.services['ptz']) {
		callback(new Error('The device does not support PTZ.'));
		return;
	}

	var speed = params['speed'];
	if(!speed) {
		speed = {};
	}
	var x = speed['x'] || 0;
	var y = speed['y'] || 0;
	var z = speed['z'] || 0;

	var timeout = params['timeout'];
	if(!timeout || typeof(timeout) !== 'number') {
		timeout = 1;
	}
	var p = {
		'ProfileToken': this.current_profile['token'],
		'Velocity'    : {'x': x, 'y': y, 'z': z},
		'Timeout'     : timeout
	};
	this.ptz_moving = true;
	this.services['ptz'].continuousMove(p, (error) => {
		callback(null);
	});
};

/* ------------------------------------------------------------------
* Method: ptzStop([callback])
* ---------------------------------------------------------------- */
OnvifDevice.prototype.ptzStop = function(callback) {
	if(typeof(callback) !== 'function') {
		callback = function() {};
	}
	if(!this.current_profile) {
		callback(new Error('No media profile is selected.'));
		return;
	}
	if(!this.services['ptz']) {
		callback(new Error('The device does not support PTZ.'));
		return;
	}
	this.ptz_moving = false;
	var p = {
		'ProfileToken': this.current_profile['token'],
		'PanTilt': true,
		'Zoom': true
	};
	this.services['ptz'].stop(p, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: setAuth(user, pass)
* ---------------------------------------------------------------- */
OnvifDevice.prototype.setAuth = function(user, pass) {
	this.user = user || '';
	this.pass = pass || '';
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	}
	for(var k in this.services) {
		var s = this.services[k];
		if(s) {
			this.services[k].setAuth(user, pass);
		}
	}
};

/* ------------------------------------------------------------------
* Method: init([callback])
* ---------------------------------------------------------------- */
OnvifDevice.prototype.init = function(callback) {
	if(typeof(callback) !== 'function') {
		callback = function() {};
	}
	this._getSystemDateAndTime(callback);
};

// GetSystemDateAndTime (Access Class: PRE_AUTH)
OnvifDevice.prototype._getSystemDateAndTime = function(callback) {
	this.services.device.getSystemDateAndTime((error, result) => {
		if(error) {
			callback(new Error('Failed to initialize the device: ' + error.toString()));
			return;
		}
		this.time_diff = this.services.device.getTimeDiff();
		this._getCapabilities(callback);
	});
};

// GetCapabilities (Access Class: PRE_AUTH)
OnvifDevice.prototype._getCapabilities = function(callback) {
	this.services.device.getCapabilities((error, result) => {
		if(error) {
			callback(new Error('Failed to initialize the device: ' + error.toString()));
			return;
		}
		var c = result['data']['GetCapabilitiesResponse']['Capabilities'];
		if(!c) {
			callback(new Error('Failed to initialize the device: No capabilities were found.'));
			return;
		}
		var events = c['Events'];
		if(events && events['XAddr']) {
			this.services.events = new mOnvifServiceEvents({
				'xaddr'    : events['XAddr'],
				'time_diff': this.time_diff,
				'user'     : this.user,
				'pass'     : this.pass
			});
		}
		var imaging = c['Imaging'];
		if(imaging && imaging['XAddr']) {
			/*
			this.services.imaging = new mOnvifServiceImaging({
				'xaddr'    : imaging['XAddr'],
				'time_diff': this.time_diff,
				'user'     : this.user,
				'pass'     : this.pass
			});
			*/
		}
		var media = c['Media'];
		if(media && media['XAddr']) {
			this.services.media = new mOnvifServiceMedia({
				'xaddr': media['XAddr'],
				'time_diff': this.time_diff,
				'user'     : this.user,
				'pass'     : this.pass
			});
		}
		var ptz = c['PTZ'];
		if(ptz && ptz['XAddr']) {
			this.services.ptz = new mOnvifServicePtz({
				'xaddr': ptz['XAddr'],
				'time_diff': this.time_diff,
				'user'     : this.user,
				'pass'     : this.pass
			});
		}

		if(this.services.media) {
			this._getDeviceInformation(callback);
		} else {
			callback(JSON.parse(JSON.stringify(this.information)));
		}
	});
};

// GetDeviceInformation (Access Class: READ_SYSTEM)
OnvifDevice.prototype._getDeviceInformation = function(callback) {
	this.services.device.getDeviceInformation((error, result) => {
		if(error) {
			callback(new Error('Failed to initialize the device: ' + error.toString()));
			return;
		}
		this.information = result['data']['GetDeviceInformationResponse'];
		this._mediaGetProfiles(callback);
	});
};

// Media::GetProfiles (Access Class: READ_MEDIA)
OnvifDevice.prototype._mediaGetProfiles = function(callback) {
	this.services.media.getProfiles((error, result) => {
		if(error) {
			callback(new Error('Failed to initialize the device: ' + error.toString()));
			return;
		}
		var profiles = result['data']['GetProfilesResponse']['Profiles'];
		if(!profiles) {
			callback(new Error('Failed to initialize the device: The targeted device does not any media profiles.'));
			return;
		}
		profiles.forEach((p) => {
			var profile = {
				'token': p['$']['token'],
				'name': p['Name'],
				'snapshot': '',
				'stream': {
					'udp': '',
					'http': '',
					'rtsp': ''
				},
				'video': {
					'source': null,
					'encoder': null
				},
				'audio': {
					'source': null,
					'encoder': null
				},
				'ptz': {
					'range': {
						'x': {
							'min': 0,
							'max': 0
						},
						'y': {
							'min': 0,
							'max': 0
						},
						'z': {
							'min': 0,
							'max': 0
						}
					}
				}
			};

			if(p['VideoSourceConfiguration']) {
				profile['video']['source'] = {
					'token' : p['VideoSourceConfiguration']['$']['token'],
					'name'  : p['VideoSourceConfiguration']['Name'],
					'bounds': {
						'width' : parseInt(p['VideoSourceConfiguration']['Bounds']['$']['width'], 10),
						'height': parseInt(p['VideoSourceConfiguration']['Bounds']['$']['height'], 10),
						'x'     : parseInt(p['VideoSourceConfiguration']['Bounds']['$']['x'], 10),
						'y'     : parseInt(p['VideoSourceConfiguration']['Bounds']['$']['y'], 10)
					}
				};
			}
			if(p['VideoEncoderConfiguration']) {
				profile['video']['encoder'] = {
					'token'     : p['VideoEncoderConfiguration']['$']['token'],
					'name'      : p['VideoEncoderConfiguration']['Name'],
					'resolution': {
						'width': parseInt(p['VideoEncoderConfiguration']['Resolution']['Width'], 10),
						'height': parseInt(p['VideoEncoderConfiguration']['Resolution']['Height'], 10),
					},
					'quality'   : parseInt(p['VideoEncoderConfiguration']['Quality'], 10),
					'framerate' : parseInt(p['VideoEncoderConfiguration']['RateControl']['FrameRateLimit'], 10),
					'bitrate'   : parseInt(p['VideoEncoderConfiguration']['RateControl']['BitrateLimit'], 10),
					'encoding'  : p['VideoEncoderConfiguration']['Encoding']
				};
			}
			if(p['AudioSourceConfiguration']) {
				profile['audio']['source'] = {
					'token' : p['AudioSourceConfiguration']['$']['token'],
					'name'  : p['AudioSourceConfiguration']['Name']
				};
			}
			if(p['AudioEncoderConfiguration']) {
				profile['audio']['encoder'] = {
					'token'     : ('$' in p['AudioEncoderConfiguration']) ? p['AudioEncoderConfiguration']['$']['token'] : '',
					'name'      : p['AudioEncoderConfiguration']['Name'],
					'bitrate'   : parseInt(p['AudioEncoderConfiguration']['Bitrate'], 10),
					'samplerate': parseInt(p['AudioEncoderConfiguration']['SampleRate'], 10),
					'encoding'  : p['AudioEncoderConfiguration']['Encoding']
				};
			}
			if(p['PTZConfiguration']) {
				try {
					var r = p['PTZConfiguration']['PanTiltLimits']['Range'];
					var xr = r['XRange'];
					var x = profile['ptz']['range']['x'];
					x['min'] = parseFloat(xr['Min']);
					x['max'] = parseFloat(xr['Max']);
				} catch(e) {}
				try {
					var r = p['PTZConfiguration']['PanTiltLimits']['Range'];
					var yr = r['YRange'];
					var y = profile['ptz']['range']['y'];
					y['min'] = parseFloat(yr['Min']);
					y['max'] = parseFloat(yr['Max']);
				} catch(e) {}
				try {
					var r = p['PTZConfiguration']['ZoomLimits']['Range'];
					var zr = r['XRange'];
					var z = profile['ptz']['range']['z'];
					z['min'] = parseFloat(zr['Min']);
					z['max'] = parseFloat(zr['Max']);
				} catch(e) {}
			}

			this.profile_list.push(profile);
			if(!this.current_profile) {
				this.current_profile = profile;
			}
		});
		this._mediaGetStreamURI(callback);
	});
};

// Media::GetStreamURI (Access Class: READ_MEDIA)
OnvifDevice.prototype._mediaGetStreamURI = function(callback, profile_index, protocol_list) {
	if(!profile_index) {
		profile_index = 0;
	}
	if(!protocol_list || protocol_list.length === 0) {
		protocol_list = ['UDP', 'HTTP', 'RTSP'];
	}
	var profile = this.profile_list[profile_index];
	if(this.profile_list.length < profile_index + 1) {
		this._mediaGetSnapshotUri(callback);
		return;
	}
	var token = profile['token'];
	var protocol = protocol_list.shift();

	var params = {
		'ProfileToken': token,
		'Protocol': protocol
	};
	this.services.media.getStreamUri(params, (error, result) => {
		if(!error) {
			var uri = result['data']['GetStreamUriResponse']['MediaUri']['Uri'];
			this.profile_list[profile_index]['stream'][protocol.toLowerCase()] = uri;
		}
		if(protocol_list.length === 0) {
			profile_index ++;
		}
		this._mediaGetStreamURI(callback, profile_index, protocol_list);
	});
};

// Media::GetSnapshotUri (Access Class: READ_MEDIA)
OnvifDevice.prototype._mediaGetSnapshotUri = function(callback, profile_index) {
	if(!profile_index) {
		profile_index = 0;
	}
	var profile = this.profile_list[profile_index];
	if(!profile) {
		callback(null, JSON.parse(JSON.stringify(this.information)));
		return;
	}
	var params = {'ProfileToken': profile['token']};
	this.services.media.getSnapshotUri(params, (error, result) => {
		if(!error) {
			try {
				profile['snapshot'] = result['data']['GetSnapshotUriResponse']['MediaUri']['Uri'];
			} catch(e) {}
			this._mediaGetSnapshotUri(callback, profile_index + 1);
		}
	});
};

module.exports = OnvifDevice;