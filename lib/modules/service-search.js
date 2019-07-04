/* ------------------------------------------------------------------
 * node-onvif - service-search.js
 *
 * Copyright (c) 2018 - 2019, Gabriele Monaco, All rights reserved.
 * Released under the MIT license
 * Date: 2019-04-12
 * ---------------------------------------------------------------- */
'use strict';
const mUrl    = require('url');
const mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
 * Constructor: OnvifServiceSearch(params)
 * - params:
 *    - xaddr   : URL of the entry point for the search service
 *                (Required)
 *    - user  : User name (Optional)
 *    - pass  : Password (Optional)
 *    - time_diff: ms
 * ---------------------------------------------------------------- */
function OnvifServiceSearch(params) {
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
		'xmlns:tse="http://www.onvif.org/ver10/search/wsdl"',
		'xmlns:tt="http://www.onvif.org/ver10/schema"'
	];
};

OnvifServiceSearch.prototype._createRequestSoap = function(body) {
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
OnvifServiceSearch.prototype.setAuth = function(user, pass) {
	this.user = user || '';
	this.pass = pass || '';
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	} else {
		this.oxaddr.auth = '';
	}
};

/* ------------------------------------------------------------------
 * Method: getServiceCapabilities([callback])
 * ---------------------------------------------------------------- */
OnvifServiceSearch.prototype.getServiceCapabilities = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<tse:GetServiceCapabilities/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetServiceCapabilities', soap).then((result) => {
			try {
				let d = result['data']['Capabilities'];
				if(!Array.isArray(d)) {
					result['data']['Capabilities'] = [d];
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

/* ------------------------------------------------------------------
 * Method: getRecordingSummary([callback])
 * ---------------------------------------------------------------- */
OnvifServiceSearch.prototype.getRecordingSummary = function(callback) {
	let promise = new Promise((resolve, reject) => {
		let soap_body = '<tse:GetRecordingSummary/>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetRecordingSummary', soap).then((result) => {
			try {
				let d = result['data']['Summary'];
				if(!Array.isArray(d)) {
					result['data']['Summary'] = [d];
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

/* ------------------------------------------------------------------
 * Method: findRecordings(params[, callback])
 * - params:
 *   - Scope                        | Object  | required | scope defines the dataset to consider for this search
 *     - IncludedSources            | Array   | optional | a list of sources that are included in the scope
 *       - Type                     | String  | optional |
 *       - Token                    | String  | required |
 *     - IncludedRecordings         | Array   | optional | a list of recordings that are included in the scope
 *     - RecordingInformationFilter | String  | optional | an xpath expression used to specify what recordings to search
 *     - Extension                  | String  | optional | extension point
 *   - MaxMatches                   | Integer | optional | the search will be completed after this many matches
 *   - KeepAliveTime                | Integer | required | the time the search session will be kept alive after responding to this and subsequent requests
 *
 * ---------------------------------------------------------------- */
OnvifServiceSearch.prototype.findRecordings = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['Scope'], 'object')) {
			reject(new Error('The "Scope" property was invalid: ' + err_msg));
			return;
		}

		let klist = ['IncludedSources', 'IncludedRecordings', 'RecordingInformationFilter', 'Extension'];
		let tlist = ['array', 'array', 'string', 'string'];

		for(let i=0; i<klist.length; i++) {
			let k = klist[i];
			if(k in params['Scope']){
				let v = params['Scope'][k];
				let t = tlist[i];
				if(err_msg = mOnvifSoap.isInvalidValue(v, t)) {
					reject(new Error('The "' + k + '" property was invalid: ' + err_msg));
					return;
				}
			}
		}

		if('IncludedSources' in params['Scope']) { //FIXME it's a list
			for(let i=0; i<params['Scope']['IncludedSources'].length; i++) {
				let v = params['Scope']['IncludedSources'][i];
				if(err_msg = mOnvifSoap.isInvalidValue(v, 'object')) {
					reject(new Error('The "IncludedSources" property was invalid: ' + err_msg));
					return;
				}

				if('Type' in v){
					if(err_msg = mOnvifSoap.isInvalidValue(v['Type'], 'string')) {
						reject(new Error('The "Type" property was invalid: ' + err_msg));
						return;
					}
				}

				if(err_msg = mOnvifSoap.isInvalidValue(v['Token'], 'string')) {
					reject(new Error('The "Token" property was invalid: ' + err_msg));
					return;
				}
			}
		}

		if('IncludedRecordings' in params['Scope']) { //FIXME it's a list
			for(let i=0; i<params['Scope']['IncludedRecordings'].length; i++) {
				let v = params['Scope']['IncludedRecordings'][i];
				if(err_msg = mOnvifSoap.isInvalidValue(v, 'string')) {
					reject(new Error('The "IncludedRecordings" property was invalid: ' + err_msg));
					return;
				}
			}
		}

		if('MaxMatches' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['MaxMatches'], 'integer')) {
				reject(new Error('The "MaxMatches" property was invalid: ' + err_msg));
				return;
			}
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['KeepAliveTime'], 'integer')) {
			reject(new Error('The "KeepAliveTime" property was invalid: ' + err_msg));
			return;
		}

		let soap_body = '';
		soap_body += '<tse:FindRecordings>';
		soap_body +=	 '<tse:Scope>';
		if(params['Scope']['IncludedSources']){
			params['Scope']['IncludedSources'].forEach((o) => {
				soap_body += '<tt:IncludedSources Type="http://www.onvif.org/ver10/schema/Receiver">';
				soap_body +=   '<tt:Token>' + o['Token'] + '</tt:Token>';
				if(o['Type']){
					soap_body += '<tt:Type>' + o['Type'] + '</tt:Type>';
				}
				soap_body += '</tt:IncludedSources>';
			})
		}
		if(params['Scope']['IncludedRecordings']){
			params['Scope']['IncludedRecordings'].forEach((s) => {
				soap_body += '<tt:IncludedRecordings>' + s + '</tt:IncludedRecordings>';
			})
		}
		if(params['Scope']['RecordingInformationFilter']){
			soap_body += '<tt:RecordingInformationFilter>' + params['Scope']['RecordingInformationFilter'] + '</tt:RecordingInformationFilter>';
		}
		if(params['Scope']['Extension']){
			soap_body += '<tt:Extension>' + params['Scope']['Extension'] + '</tt:Extension>';
		}
		soap_body +=	 '</tse:Scope>';
		if(params['MaxMatches']){
			soap_body += '<tse:MaxMatches>' + params['MaxMatches'] + '</tse:MaxMatches>';
		}
		soap_body +=	 '<tse:KeepAliveTime>PT'+ params['KeepAliveTime'] + 'S</tse:KeepAliveTime>';
		soap_body += '</tse:FindRecordings>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'FindRecordings', soap).then((result) => {
			try {
				let d = result['data']['SearchToken'];
				if(!Array.isArray(d)) {
					result['data']['SearchToken'] = [d];
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

/* ------------------------------------------------------------------
 * Method: getRecordingSearchResults(params[, callback])
 * - params:
 *   - SearchToken    | String  | required | the search session to get results from
 *   - MinResults     | Integer | optional | the minimum number of results to return in one response
 *   - MaxResults     | Integer | optional | the maximum number of results to return in one response
 *   - WaitTime       | Integer | optional | the maximum time before responding to the request
 *
 * ---------------------------------------------------------------- */
OnvifServiceSearch.prototype.getRecordingSearchResults = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = '';
		if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
			reject(new Error('The value of "params" was invalid: ' + err_msg));
			return;
		}

		if(err_msg = mOnvifSoap.isInvalidValue(params['SearchToken'], 'string')) {
			reject(new Error('The "SearchToken" property was invalid: ' + err_msg));
			return;
		}

		if('MinResults' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['MinResults'], 'integer')) {
				reject(new Error('The "MinResults" property was invalid: ' + err_msg));
				return;
			}
		}

		if('MaxResults' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['MaxResults'], 'integer')) {
				reject(new Error('The "MaxResults" property was invalid: ' + err_msg));
				return;
			}
		}

		if('WaitTime' in params) {
			if(err_msg = mOnvifSoap.isInvalidValue(params['WaitTime'], 'integer')) {
				reject(new Error('The "WaitTime" property was invalid: ' + err_msg));
				return;
			}
		}

		let soap_body = '';
		soap_body +=   '<tse:GetRecordingSearchResults>';
		soap_body +=     '<tse:SearchToken>' + params['SearchToken'] + '</tse:SearchToken>';
		if(params['MinResults']) {
			soap_body += '<tse:MinResults>' + params['MinResults'] + '</tse:MinResults>';
		}
		if(params['MaxResults']) {
			soap_body += '<tse:MaxResults>' + params['MaxResults'] + '</tse:MaxResults>';
		}
		if(params['WaitTime']) {
			soap_body += '<tse:WaitTime>PT' + params['WaitTime'] + 'S</tse:WaitTime>';
		}
		soap_body +=   '</tse:GetRecordingSearchResults>';
		let soap = this._createRequestSoap(soap_body);
		mOnvifSoap.requestCommand(this.oxaddr, 'GetRecordingSearchResults', soap).then((result) => {
			try {
				let d = result['data']['ResultList'];
				if(!Array.isArray(d)) {
					result['data']['ResultList'] = [d];
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

module.exports = OnvifServiceSearch;
