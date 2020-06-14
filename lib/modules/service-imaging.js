/* ------------------------------------------------------------------
* node-onvif - service-events.js
*
* Copyright (c) 2016 - 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-08-26
* ---------------------------------------------------------------- */
'use strict';
const mUrl    = require('url');
const mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
* Constructor: OnvifServiceEvents(params)
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

OnvifServiceImaging.prototype.getOptions = function(params, callback){
	let err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
		reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
		return;
	}
	let promise = new Promise((resolve, reject) => {
		let soap_body = '';
		soap_body += '<timg:GetOptions>';
		soap_body +=   '<tt:ReferenceToken>' + params['VideoSourceToken'] + '</tt:ReferenceToken>';
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

}

OnvifServiceImaging.prototype.getImagingSettings = function(params, callback){
	let err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params['VideoSourceToken'], 'string')) {
		reject(new Error('The "VideoSourceToken" property was invalid: ' + err_msg));
		return;
	}
	
	let promise = new Promise((resolve, reject) => {
		let soap_body = '';
		soap_body += '<timg:GetImagingSettings>';
		soap_body +=   '<timg:VideoSourceToken>' + params['VideoSourceToken'] + '</timg:VideoSourceToken>';
		soap_body += '</timg:GetImagingSettings>';
		
		let soap = this._createRequestSoap(soap_body);
		console.log(soap_body);
		
		mOnvifSoap.requestCommand(this.oxaddr, 'GetImagingSettings', soap).then((result) => {
			resolve(result);
		}).catch((error) => {
			console.log(error);
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
        soap_body +=     '<tt:Contrast>'+ params['Contrast'] + '</tt:Contrast>';
		soap_body +=   '</timg:ImagingSettings>';
		soap_body +=   '<timg:ForcePersistence>true</timg:ForcePersistence>';
		soap_body += '</timg:SetImagingSettings>';
		let soap = this._createRequestSoap(soap_body);
		console.log(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'SetImagingSettings', soap).then((result) => {
			console.log(result.data.SetImagingSettingsResponse);
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
	
}


module.exports = OnvifServiceImaging;