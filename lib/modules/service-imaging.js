/* ------------------------------------------------------------------
* node-onvif - service-imaging.js
*
* Copyright (c) 2016 - 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-08-30
* ---------------------------------------------------------------- */
'use strict';
const mUrl = require('url');
const mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
* Constructor: OnvifServiceImaging(params)
* - params:
*    - xaddr   : URL of the entry point for the imaging service
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
		'xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl"'
	];
}

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
* Method: getImagingSettings(params[, callback])
* - params:
*   - ConfigurationToken | String | required | a video token of the configuration
*
* {
*   'ConfigurationToken': 'Configuration1'
* }
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.getImagingSettings = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}
	
		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}
	
		let soap_body = '';
		soap_body += '<GetImagingSettings xmlns="http://www.onvif.org/ver20/imaging/wsdl">';
		soap_body +=   '<VideoSourceToken>' + params['ConfigurationToken'] + '</VideoSourceToken>';
		soap_body += '</GetImagingSettings>';
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
* Method: getImagingSettings(params[, callback])
* - params:
*   - ConfigurationToken | String | required | a video token of the configuration
*	- ImagingSettings | object | required | an ImagingSettings object
* {
*   'ConfigurationToken': 'Configuration1'
*	'ImagingSettings': '{object}'
* }
* ---------------------------------------------------------------- */
OnvifServiceImaging.prototype.setImagingSettings = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}
	
		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}
		if(err_msg = mOnvifSoap.isInvalidValue(params['ImagingSettings'], 'object')) {
			reject(new Error('The "ImagingSettings" property was invalid: ' + err_msg));
			return;
		}
	
		let soap_body = '';
		soap_body += '<SetImagingSettings xmlns="http://www.onvif.org/ver20/imaging/wsdl">';
		soap_body +=   	'<VideoSourceToken>' + params['ConfigurationToken'] + '</VideoSourceToken>';
		soap_body +=   	'<ImagingSettings>'
		soap_body +=   	'<BacklightCompensation xmlns="http://www.onvif.org/ver10/schema">'
		soap_body +=   		'<Mode>' + params.ImagingSettings.BacklightCompensation.Mode + '</Mode>'
		soap_body +=   	'</BacklightCompensation>'
		soap_body +=   	'<Brightness xmlns="http://www.onvif.org/ver10/schema">' + params.ImagingSettings.Brightness + '</Brightness>'
		soap_body +=   	'<ColorSaturation xmlns="http://www.onvif.org/ver10/schema">' + params.ImagingSettings.ColorSaturation + '</ColorSaturation>'
		soap_body +=   	'<Contrast xmlns="http://www.onvif.org/ver10/schema">' + params.ImagingSettings.Contrast + '</Contrast>'
		soap_body +=   	'<Exposure xmlns="http://www.onvif.org/ver10/schema">'
		soap_body +=   		'<Mode>' + params.ImagingSettings.Exposure.Mode + '</Mode>'
		soap_body +=   		'<MinExposureTime>' + params.ImagingSettings.Exposure.MinExposureTime + '</MinExposureTime>'
		soap_body +=   		'<MaxExposureTime>' + params.ImagingSettings.Exposure.MaxExposureTime + '</MaxExposureTime>'
		soap_body +=   		'<MinGain>' + params.ImagingSettings.Exposure.MinGain + '</MinGain>'
		soap_body +=   		'<MaxGain>' + params.ImagingSettings.Exposure.MaxGain + '</MaxGain>'
		soap_body +=   	'</Exposure>'
		soap_body +=   	'<IrCutFilter xmlns="http://www.onvif.org/ver10/schema">' + params.ImagingSettings.IrCutFilter + '</IrCutFilter>'
		soap_body +=   	'<Sharpness xmlns="http://www.onvif.org/ver10/schema">' + params.ImagingSettings.Sharpness + '</Sharpness>'
		soap_body +=   	'<WideDynamicRange xmlns="http://www.onvif.org/ver10/schema">'
		soap_body +=   		'<Mode>' + params.ImagingSettings.WideDynamicRange.Mode + '</Mode>'
		soap_body +=	'</WideDynamicRange>';
		soap_body +=   	'<WhiteBalance xmlns="http://www.onvif.org/ver10/schema">'
		soap_body +=   		'<Mode>' + params.ImagingSettings.WhiteBalance.Mode + '</Mode>'
		soap_body +=	'</WhiteBalance>';
		soap_body +=	'<ForcePersistence>true</ForcePersistence>';
		soap_body +=	'</ImagingSettings>';
		soap_body += '</SetImagingSettings>';
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


module.exports = OnvifServiceImaging;