/* ------------------------------------------------------------------
* node-onvif - device.js
*
* Copyright (c) 2016 - 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-08-29
* ---------------------------------------------------------------- */
'use strict';
const mCrypto = require('crypto');
const mUrl    = require('url');
const mUtil   = require('util');
const mEventEmitter = require('events').EventEmitter;

const mOnvifServiceDevice = require('./service-device.js');
const mOnvifServiceMedia  = require('./service-media.js');
const mOnvifServicePtz    = require('./service-ptz.js');
const mOnvifServiceEvents = require('./service-events.js');
const mOnvifHttpAuth      = require('./http-auth.js');

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
function OnvifDevice(params) {
	if(!params || typeof(params) !== 'object') {
		throw new Error('The parameter was invalid.');
	}

	this.address = '';
	this.xaddr = '';
	this.user = '';
	this.pass = '';

	if(('xaddr' in params) && typeof(params['xaddr']) === 'string') {
		this.xaddr = params['xaddr'];
		let ourl = mUrl.parse(this.xaddr);
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

OnvifDevice.prototype._isValidCallback = function(callback) {
	return (callback && typeof(callback) === 'function') ? true : false;
};

OnvifDevice.prototype._execCallback = function(callback, arg1, arg2) {
	if(this._isValidCallback(callback)) {
		callback(arg1, arg2);
	}
};

/* ------------------------------------------------------------------
* Method: getInformation()
* ---------------------------------------------------------------- */
OnvifDevice.prototype.getInformation = function() {
	let o = this.information;
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
	let o = this.current_profile;
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
* Method: changeProfile(index|token)
* ---------------------------------------------------------------- */
OnvifDevice.prototype.changeProfile = function(index) {
	if(typeof(index) === 'number' && index >=0 && index % 1 === 0) {
		let p = this.profile_list[index];
		if(p) {
			this.current_profile = p;
			return this.getCurrentProfile();
		} else {
			return null;
		}
	} else if(typeof(index) === 'string' && index.length > 0) {
		let new_profile = null;
		for(let i=0; i<this.profile_list.length; i++) {
			if(this.profile_list[i]['token'] === index) {
				new_profile = this.profile_list[i];
				break;
			}
		}
		if(new_profile) {
			this.current_profile = new_profile;
			return this.getCurrentProfile();
		} else {
			return null;
		}
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
	let url = this.current_profile['stream']['udp'];
	return url ? url : '';
};

/* ------------------------------------------------------------------
* Method: fetchSnapshot()
* ---------------------------------------------------------------- */
OnvifDevice.prototype.fetchSnapshot = function(callback) {
	let promise = new Promise((resolve, reject) => {
		if(!this.current_profile) {
			reject(new Error('No media profile is selected.'));
			return;
		}
		if(!this.current_profile['snapshot']) {
			reject(new Error('The device does not support snapshot or you have not authorized by the device.'));
			return;
		}
		let ourl = mUrl.parse(this.current_profile['snapshot']);
		let options = {
			protocol: ourl.protocol,
			auth    : this.user + ':' + this.pass,
			hostname: ourl.hostname,
			port    : ourl.port || 80,
			path    : ourl.path,
			method  : 'GET'
		};
		let req = mOnvifHttpAuth.request(options, (res) => {
			let buffer_list = [];
			res.on('data', (buf) => {
				buffer_list.push(buf);
			});
			res.on('end', () => {
				if(res.statusCode === 200) {
					let buffer = Buffer.concat(buffer_list);
					let ct = res.headers['content-type'];
					if(!ct) { // workaround for DBPOWER
						ct = 'image/jpeg';
					}
					if(ct.match(/image\//)) {
						resolve({'headers': res.headers, 'body': buffer});
					} else if(ct.match(/^text\//)) {
						reject(new Error(buffer.toString()));
					} else {
						reject(new Error('Unexpected data: ' + ct));
					}
				} else {
					reject(new Error(res.statusCode + ' ' + res.statusMessage));
				}
			});
			req.on('error', (error) => {
				reject(error);
			});
		});
		req.on('error', (error) => {
			reject(error);
		});
		req.end();
	});
	if(this._isValidCallback(callback)) {
		promise.then((res) => {
			callback(null, res);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
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
	let promise = new Promise((resolve, reject) => {
		if(!this.current_profile) {
			reject(new Error('No media profile is selected.'));
			return;
		}
		if(!this.services['ptz']) {
			reject(new Error('The device does not support PTZ.'));
			return;
		}

		let speed = params['speed'];
		if(!speed) {
			speed = {};
		}
		let x = speed['x'] || 0;
		let y = speed['y'] || 0;
		let z = speed['z'] || 0;

		let timeout = params['timeout'];
		if(!timeout || typeof(timeout) !== 'number') {
			timeout = 1;
		}
		let p = {
			'ProfileToken': this.current_profile['token'],
			'Velocity'    : {'x': x, 'y': y, 'z': z},
			'Timeout'     : timeout
		};
		this.ptz_moving = true;
		this.services['ptz'].continuousMove(p).then(() => {
			resolve();
		}).catch((error) => {
			reject(error);
		});
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

/* ------------------------------------------------------------------
* Method: ptzStop([callback])
* ---------------------------------------------------------------- */
OnvifDevice.prototype.ptzStop = function(callback) {
	let promise = new Promise((resolve, reject) => {
		if(!this.current_profile) {
			reject(new Error('No media profile is selected.'));
			return;
		}
		if(!this.services['ptz']) {
			reject(new Error('The device does not support PTZ.'));
			return;
		}
		this.ptz_moving = false;
		let p = {
			'ProfileToken': this.current_profile['token'],
			'PanTilt': true,
			'Zoom': true
		};
		this.services['ptz'].stop(p).then((result) => {
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(this._isValidCallback(callback)) {
		promise.then((res) => {
			callback(null, res);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
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
	for(let k in this.services) {
		let s = this.services[k];
		if(s) {
			this.services[k].setAuth(user, pass);
		}
	}
};

/* ------------------------------------------------------------------
* Method: init([callback])
* ---------------------------------------------------------------- */
OnvifDevice.prototype.init = function(callback) {
	let promise = new Promise((resolve, reject) => {
		this._getSystemDateAndTime().then(() => {
			return this._getCapabilities();
		}).then(() => {
			return this._getDeviceInformation();
		}).then(() => {
			return this._mediaGetProfiles();
		}).then(() => {
			return this._mediaGetStreamURI();
		}).then(() => {
			return this._mediaGetSnapshotUri();
		}).then(() => {
			let info = this.getInformation();
			resolve(info);
		}).catch((error) => {
			reject(error);
		});
	});
	if(this._isValidCallback(callback)) {
		promise.then((info) => {
			callback(null, info);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

// GetSystemDateAndTime (Access Class: PRE_AUTH)
OnvifDevice.prototype._getSystemDateAndTime = function() {
	let promise = new Promise((resolve, reject) => {
		this.services.device.getSystemDateAndTime((error, result) => {
			// Ignore the error becase some devices do not support
			// the GetSystemDateAndTime command and the error does
			// not cause any trouble.
			if(!error) {
				this.time_diff = this.services.device.getTimeDiff();
			}
			resolve();
		});
	});
	return promise;
};

// GetCapabilities (Access Class: PRE_AUTH)
OnvifDevice.prototype._getCapabilities = function() {
	let promise = new Promise((resolve, reject) => {
		this.services.device.getCapabilities((error, result) => {
			if(error) {
				reject(new Error('Failed to initialize the device: ' + error.toString()));
				return;
			}
			let c = result['data']['GetCapabilitiesResponse']['Capabilities'];
			if(!c) {
				reject(new Error('Failed to initialize the device: No capabilities were found.'));
				return;
			}
			let events = c['Events'];
			if(events && events['XAddr']) {
				this.services.events = new mOnvifServiceEvents({
					'xaddr'    : events['XAddr'],
					'time_diff': this.time_diff,
					'user'     : this.user,
					'pass'     : this.pass
				});
			}
			let imaging = c['Imaging'];
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
			let media = c['Media'];
			if(media && media['XAddr']) {
				this.services.media = new mOnvifServiceMedia({
					'xaddr': media['XAddr'],
					'time_diff': this.time_diff,
					'user'     : this.user,
					'pass'     : this.pass
				});
			}
			let ptz = c['PTZ'];
			if(ptz && ptz['XAddr']) {
				this.services.ptz = new mOnvifServicePtz({
					'xaddr': ptz['XAddr'],
					'time_diff': this.time_diff,
					'user'     : this.user,
					'pass'     : this.pass
				});
			}
			resolve();
		});
	});
	return promise;
};

// GetDeviceInformation (Access Class: READ_SYSTEM)
OnvifDevice.prototype._getDeviceInformation = function() {
	let promise = new Promise((resolve, reject) => {
		this.services.device.getDeviceInformation((error, result) => {
			if(error) {
				reject(new Error('Failed to initialize the device: ' + error.toString()));
			} else {
				this.information = result['data']['GetDeviceInformationResponse'];
				resolve();
			}
		});
	});
	return promise;
};

// Media::GetProfiles (Access Class: READ_MEDIA)
OnvifDevice.prototype._mediaGetProfiles = function() {
	let promise = new Promise((resolve, reject) => {
		this.services.media.getProfiles((error, result) => {
			if(error) {
				reject(new Error('Failed to initialize the device: ' + error.toString()));
				return;
			}
			let profiles = result['data']['GetProfilesResponse']['Profiles'];
			if(!profiles) {
				reject(new Error('Failed to initialize the device: The targeted device does not any media profiles.'));
				return;
			}
			profiles.forEach((p) => {
				let profile = {
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
						let r = p['PTZConfiguration']['PanTiltLimits']['Range'];
						let xr = r['XRange'];
						let x = profile['ptz']['range']['x'];
						x['min'] = parseFloat(xr['Min']);
						x['max'] = parseFloat(xr['Max']);
					} catch(e) {}
					try {
						let r = p['PTZConfiguration']['PanTiltLimits']['Range'];
						let yr = r['YRange'];
						let y = profile['ptz']['range']['y'];
						y['min'] = parseFloat(yr['Min']);
						y['max'] = parseFloat(yr['Max']);
					} catch(e) {}
					try {
						let r = p['PTZConfiguration']['ZoomLimits']['Range'];
						let zr = r['XRange'];
						let z = profile['ptz']['range']['z'];
						z['min'] = parseFloat(zr['Min']);
						z['max'] = parseFloat(zr['Max']);
					} catch(e) {}
				}

				this.profile_list.push(profile);
				if(!this.current_profile) {
					this.current_profile = profile;
				}
			});
			resolve();
		});
	});
	return promise;
};

// Media::GetStreamURI (Access Class: READ_MEDIA)
OnvifDevice.prototype._mediaGetStreamURI = function() {
	let protocol_list = ['UDP', 'HTTP', 'RTSP'];
	let promise = new Promise((resolve, reject) => {
		let profile_index = 0;
		let protocol_index = 0;
		let getStreamUri = () => {
			let profile = this.profile_list[profile_index];
			if(profile) {
				let protocol = protocol_list[protocol_index];
				if(protocol) {
					let token = profile['token'];
					let params = {
						'ProfileToken': token,
						'Protocol': protocol
					};
					this.services.media.getStreamUri(params, (error, result) => {
						if(!error) {
							let uri = result['data']['GetStreamUriResponse']['MediaUri']['Uri'];
							this.profile_list[profile_index]['stream'][protocol.toLowerCase()] = uri;
						}
						protocol_index ++;
						getStreamUri();
					});
				} else {
					profile_index ++;
					protocol_index = 0;
					getStreamUri();
				}
			} else {
				resolve();
				return;
			}
		};
		getStreamUri();
	});
	return promise;
};

// Media::GetSnapshotUri (Access Class: READ_MEDIA)
OnvifDevice.prototype._mediaGetSnapshotUri = function() {
	let promise = new Promise((resolve, reject) => {
		let profile_index = 0;
		let getSnapshotUri = () => {
			let profile = this.profile_list[profile_index];
			if(profile) {
				let params = {'ProfileToken': profile['token']};
				this.services.media.getSnapshotUri(params, (error, result) => {
					if(!error) {
						try {
							profile['snapshot'] = result['data']['GetSnapshotUriResponse']['MediaUri']['Uri'];
						} catch(e) {}
					}
					profile_index ++;
					getSnapshotUri();
				});
			} else {
				resolve();
			}
		};
		getSnapshotUri();
	});
	return promise;
};

module.exports = OnvifDevice;