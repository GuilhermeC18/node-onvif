/* ------------------------------------------------------------------
* node-onvif - service-imaging.js
*
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';
const mUrl    = require('url');
const mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
* Constructor: OnvifServiceImaging(params)
* - params:
*    - xaddr   : URL of the entry point for the media service
*                (Required)
*    - user  : User name (Optional)
*    - pass  : Password (Optional)
*    - time_diff: ms
* ---------------------------------------------------------------- */
function OnvifServiceImaging(params) {
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
		'xmlns:ter="http://www.onvif.org/ver10/error"',
		'xmlns:xs="http://www.w3.org/2001/XMLSchema"',
		'xmlns:tt="http://www.onvif.org/ver10/schema"',
		'xmlns:timg="http://www.onvif.org/ver20/imaging/wsdl"',
		'xmlns:tns1="http://www.onvif.org/ver10/topics"'
	];
};

OnvifServiceImaging.prototype._createRequestSoap = function(body) {
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
OnvifServiceImaging.prototype.setAuth = function(user, pass) {
	this.user = user || '';
	this.pass = pass || '';
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	} else {
		this.oxaddr.auth = '';
	}
};

/* ------------------------------------------------------------------
* Method: getStatus(params[, callback])
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.getStatus = function(params, callback){
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
			reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<timg:GetStatus>';
		soap_body +=   '<timg:VideoSourceToken>' + params['VideoSourceToken'] + '</timg:VideoSourceToken>';
		soap_body += '</timg:GetStatus>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetStatus', soap).then((result) => {
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

/* ------------------------------------------------------------------
* Method: getServiceCapabilities(params[, callback])
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.getServiceCapabilities = function(params, callback){
	let promise = new Promise((resolve, reject) => {
		let soap_body = '';
		soap_body += '<timg:GetServiceCapabilities />';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetServiceCapabilities', soap).then((result) => {
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

/* ------------------------------------------------------------------
* Method: getOptions(params[, callback])
* - params:
*   - VideoSourceToken | String  | required | a token for the video source
*
* {
*   'VideoSourceToken': 'VideoSourceToken1'
* }
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.getOptions = function(params, callback){
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
			reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<timg:GetOptions>';
		soap_body +=   '<timg:VideoSourceToken>' + params['VideoSourceToken'] + '</timg:VideoSourceToken>';
		soap_body += '</timg:GetOptions>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetOptions', soap).then((result) => {
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

/* ------------------------------------------------------------------
* Method: getMoveOptions(params[, callback])
* - params:
*   - VideoSourceToken | String  | required | a token for the video source
*
* {
*   'VideoSourceToken': 'VideoSourceToken1'
* }
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.getMoveOptions = function(params, callback){
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
			reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<timg:GetMoveOptions>';
		soap_body +=   '<timg:VideoSourceToken>' + params['VideoSourceToken'] + '</timg:VideoSourceToken>';
		soap_body += '</timg:GetMoveOptions>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetMoveOptions', soap).then((result) => {
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

/* ------------------------------------------------------------------
* Method: getImagingSettings(params[, callback])
* - params:
*   - VideoSourceToken | String  | required | a token for the video source
*
* {
*   'VideoSourceToken': 'VideoSourceToken1'
* }
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.getImagingSettings = function(params, callback){
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
			reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<timg:GetImagingSettings>';
		soap_body +=   '<timg:VideoSourceToken>' + params['VideoSourceToken'] + '</timg:VideoSourceToken>';
		soap_body += '</timg:GetImagingSettings>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'GetImagingSettings', soap).then((result) => {
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

/* ------------------------------------------------------------------
* Method: getOptions(params[, callback])
* - params:
*   - VideoSourceToken | String  | required | a token for the video source
*   - Focus            | object  | optional | focus settings
*     - AutoFocusMode  | String  | optional | enum { MANUAL, AUTO }
*
* {
*   'VideoSourceToken': 'VideoSourceToken1',
*   'Focus': {
*     'AutoFocusMode': 'MANUAL'
*   }
* }
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.setImagingSettings = function(params, callback){
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
			reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<timg:SetImagingSettings>';
		soap_body +=   '<timg:VideoSourceToken>' + params['VideoSourceToken'] + '</timg:VideoSourceToken>';
		soap_body +=   '<timg:ImagingSettings>';
		if (!mOnvifSoap.isInvalidValue(params['Focus'], 'object')) {
			soap_body +=   '<tt:Focus>';
			if(!mOnvifSoap.isInvalidValue(params['Focus']['AutoFocusMode'], 'string')) {
				soap_body +=   '<tt:AutoFocusMode>' + params['Focus']['AutoFocusMode'] + '</tt:AutoFocusMode>';
			}
			soap_body +=   '</tt:Focus>';
		}
		soap_body +=   '</timg:ImagingSettings>';
		soap_body += '</timg:SetImagingSettings>';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'SetImagingSettings', soap).then((result) => {
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

/* ------------------------------------------------------------------
* Method: continuousMove(params[, callback])
* - params:
*   - VideoSourceToken | String  | required |
*   - Speed            | Float   | required | focus
*
* {
*   'VideoSourceToken': 'VideoSourceToken1',
*   'Speed': 1.0
* }
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.continuousMove = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
			reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Speed'], 'float')) {
			reject(new Error('The "Speed" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<timg:Move>';
		soap_body +=   '<timg:VideoSourceToken>' + params['VideoSourceToken'] + '</timg:VideoSourceToken>';
		soap_body +=   '<timg:Focus>';
		soap_body +=     '<tt:Continuous>';
		soap_body +=       '<tt:Speed>' + params['Speed'] + '</tt:Speed>';
		soap_body +=     '</tt:Continuous>';
		soap_body +=   '</timg:Focus>';
		soap_body += '</timg:Move>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'Move', soap).then((result) => {
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

/* ------------------------------------------------------------------
* Method: stop(params[, callback])
* - params:
*   - VideoSourceToken | String  | required | a token for the video source
*
* {
*   'VideoSourceToken': 'VideoSourceToken1'
* }
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.stop = function(params, callback){
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
			reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '<timg:Stop />';
		let soap = this._createRequestSoap(soap_body);

		mOnvifSoap.requestCommand(this.oxaddr, 'Stop', soap).then((result) => {
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

module.exports = OnvifServiceImaging;
