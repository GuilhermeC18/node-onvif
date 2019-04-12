/* ------------------------------------------------------------------
 * node-onvif - service-replay.js
 *
 * Copyright (c) 2018 - 2019, Gabriele Monaco, All rights reserved.
 * Released under the MIT license
 * Date: 2019-04-12
 * ---------------------------------------------------------------- */
'use strict';
const mUrl    = require('url');
const mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
 * Constructor: OnvifServiceReplay(params)
 * - params:
 *    - xaddr   : URL of the entry point for the replay service
 *                (Required)
 *    - user  : User name (Optional)
 *    - pass  : Password (Optional)
 *    - time_diff: ms
 * ---------------------------------------------------------------- */
function OnvifServiceReplay(params) {
	this.xaddr = '';
	this.user = '';
	this.pass = '';

	let err_msg = '';

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

	this.time_diff = params['time_diff'];
	this.name_space_attr_list = [
		'xmlns:trp="http://www.onvif.org/ver10/replay.wsdl"',
		'xmlns:tt="http://www.onvif.org/ver10/schema"'
	];
};

OnvifServiceReplay.prototype._createRequestSoap = function(body) {
	let soap = mOnvifSoap.createRequestSoap({
		'body': body,
		'xmlns': this.name_space_attr_list,
		'diff': this.time_diff,
		'user': this.user,
		'pass': this.pass
	});
	return soap;
};

/* ------------------------------------------------------------------
 * Method: setAuth(user, pass)
 * ---------------------------------------------------------------- */
OnvifServiceReplay.prototype.setAuth = function(user, pass) {
	this.user = user || '';
	this.pass = pass || '';
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	} else {
		this.oxaddr.auth = '';
	}
};

/* ------------------------------------------------------------------
 * Method: getReplayUri(params[, callback])
 * - params:
 *   - StreamSetup     | Object  | required | the connection parameters to be used for the stream
 *     - Stream        | String  | required | either RTP-Unicast, RTP-Multicast
 *     - Transport     | Object  | required |
 *       - Protocol    | String  | required | either UDP, TCP, RTSP, HTTP
 *       - Tunnel      | Object  | optional | TODO not implemented
 *   - RecordingToken  | String  | required | identifier of the recording to be streamed
 *
 * ---------------------------------------------------------------- */
OnvifServiceReplay.prototype.getReplayUri = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['StreamSetup'], 'object')) {
			reject(new Error('The "Scope" property was invalid: ' + err_msg));
			return;
		}

		let stream = params['StreamSetup']['Stream']
		if(err_msg = mOnvifSoap.isInvalidValue(stream, 'string')) {
			reject(new Error('The "Stream" property was invalid: ' + err_msg));
			return;
		} else if(!stream.match(/^(RTP-Unicast|RTP-Multicast)$/)) {
			reject(new Error('The "Stream" property was invalid: The value must be either "RTP-Unicast" or "RTP-Multicast".'));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['StreamSetup']['Transport'], 'object')) {
			reject(new Error('The "Transport" property was invalid: ' + err_msg));
			return;
		}

		let protocol = params['StreamSetup']['Transport']['Protocol']
		if(err_msg = mOnvifSoap.isInvalidValue(protocol, 'string')) {
			reject(new Error('The "Stream" property was invalid: ' + err_msg));
			return;
		} else if(!protocol.match(/^(UDP|TCP|RTSP|HTTP)$/)) {
			reject(new Error('The "Stream" property was invalid: The value must be either "UDP", "TCP", "RTSP" or "HTTP".'));
			return;
		}

		if('Tunnel' in params['StreamSetup']['Transport']['Tunnel']) {
			//TODO implement this
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['RecordingToken'], 'string')) {
			reject(new Error('The "RecordingToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<trp:GetReplayUri/>';
		soap_body +=   '<trp:StreamSetup>';
		soap_body +=     '<tt:Stream>' + params['StreamSetup']['Stream'] + '</tt:Stream>';
		soap_body +=     '<tt:Transport>';
		soap_body +=       '<tt:Protocol>' + params['StreamSetup']['Transport']['Protocol'] + '</tt:Protocol>';
		soap_body +=     '</tt:Transport>';
		soap_body +=   '</trp:StreamSetup>';
		soap_body +=   '<trp:RecordingToken>' + params['RecordingToken'] + '</trp:RecordingToken>';
		soap_body += '</trp:GetReplayUri/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetReplayUri', soap).then((result) => {
			try {
				let d = result['data']['Uri'];
				if(!Array.isArray(d)) {
					result['data']['Uri'] = [d];
				}
			} catch(e) {}
			resolve(result);
		}).catch((error) => {
			reject(error);
		});
	});
	if(callback) {
		promise.then((result) => {
			callback(null, result);
		}).catch((error) => {
			callback(error);
		});
	} else {
		return promise;
	}
};

module.exports = OnvifServiceReplay;
