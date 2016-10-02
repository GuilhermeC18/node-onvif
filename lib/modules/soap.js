/* ------------------------------------------------------------------
* node-onvif - soap.js
*
* Copyright (c) 2016, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2016-10-02
* ---------------------------------------------------------------- */
'use strict';
var mXml2Js = require('xml2js');
var mHttp   = require('http');
var mCrypto = require('crypto');
var mHtml   = null;
try {
	mHtml   = require('html');
} catch(e) {}

/* ------------------------------------------------------------------
* Constructor: OnvifSoap()
* ---------------------------------------------------------------- */
var OnvifSoap = function() {
	this.HTTP_TIMEOUT = 3000; // ms
};

/* ------------------------------------------------------------------
* Method: parse(soap, callback)
* ---------------------------------------------------------------- */
OnvifSoap.prototype.parse = function(soap, callback) {
	var opts = {
		'explicitRoot'     : false,
		'explicitArray'    : false,
		//'ignoreAttrs'      : true,
		'ignoreAttrs'      : false,
		'tagNameProcessors': [function(name) {
			var m = name.match(/^([^\:]+)\:([^\:]+)$/);
			return (m ? m[2] : name);
		}]
	};
	mXml2Js.parseString(soap, opts, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: requestCommand(oxaddr, method_name, soap, callback)
* ---------------------------------------------------------------- */
OnvifSoap.prototype.requestCommand = function(oxaddr, method_name, soap, callback) {
	this._request(oxaddr, soap, (error, xml) => {
		if(error) {
			var err = new Error('Failed to run the ' + method_name + '() method: ' + error.toString());
			callback(err);
		} else {
			this.parse(xml, (error, result) => {
				var res = {
					'soap'     : xml,
					'formatted': mHtml ? mHtml.prettyPrint(xml, {indent_size: 2}) : '',
					'converted': ''
				};
				if(error) {
					var err = new Error('Failed to parse the response SOAP: ' + error.toString());
					callback(err, res);
				} else {
					res['converted'] = result;
					var fault = this._getFaultReason(result);
					if(fault) {
						var err = new Error(fault);
						callback(err, res);
					} else {
						var parsed = this._parseResponseResult(method_name, result);
						if(parsed) {
							res['data'] = parsed;
							callback(null, res);
						} else {
							var err = new Error('The device seems to not support the ' + method_name + '() method.');
							callback(err, res);
						}
					}
				}
			});
		}
	});
};

OnvifSoap.prototype._parseResponseResult = function(method_name, res) {
	var s0 = res['Body'];
	if(!s0) {return null;}
	if((method_name + 'Response') in s0) {
		return s0;
	} else {
		null;
	}
};

OnvifSoap.prototype._request = function(oxaddr, soap, callback) {
	var post_opts = {
		protocol: oxaddr.protocol,
		//auth    : oxaddr.auth,
		hostname: oxaddr.hostname,
		port    : oxaddr.port || 80,
		path    : oxaddr.pathname,
		method  : 'POST',
		headers: {
			//'Content-Type': 'application/soap+xml; charset=utf-8; action="http://www.onvif.org/ver10/device/wsdl/GetScopes"',
			'Content-Type': 'application/soap+xml; charset=utf-8;',
			'Content-Length': Buffer.byteLength(soap)
		}
	};

	var req = mHttp.request(post_opts, (res) => {
		res.setEncoding('utf8');
		var xml = '';
		res.on('data', (chunk) => {
			xml += chunk;
		});
		res.on('end', () => {
			if(req) {
				req.removeAllListeners('error');
				req.removeAllListeners('timeout');
				req = null;
			}
			if(res) {
				res.removeAllListeners('data');
				res.removeAllListeners('end');
			}
			if(res.statusCode === 200) {
				callback(null, xml);
			} else {
				var err = new Error(res.statusCode + ' ' + res.statusMessage);
				callback(err);
			}
			res = null;
		});
	});

	req.setTimeout(this.HTTP_TIMEOUT);

	req.on('timeout', () => {
		req.abort();
	});

	req.on('error', (error) => {
		req.removeAllListeners('error');
		req.removeAllListeners('timeout');
		req = null;
		callback(error);
	});

	req.write(soap, 'utf8');
	req.end();
};

OnvifSoap.prototype._getFaultReason = function(r) {
	var reason = '';
	try {
		var reason_el = r['Body']['Fault']['Reason'];
		if(reason_el['Text']) {
			reason = reason_el['Text'];
		} else {
			var code_el = r['Body']['Fault']['Code'];
			if(code_el['Value']) {
				reason = code_el['Value'];
				var subcode_el = code_el['Subcode'];
				if(subcode_el['Value']) {
					reason += ' ' + subcode_el['Value'];
				}
			}
		}
	} catch(e) {}
	return reason;
};

/* ------------------------------------------------------------------
* Method: createRequestSoap(params)
* - params:
*   - body: description in the <s:Body>
*   - xmlns: a list of xmlns attributes used in the body
*       e.g., xmlns:tds="http://www.onvif.org/ver10/device/wsdl"
*   - diff: Time difference [ms]
*   - user: user name
*   - pass: password
* ---------------------------------------------------------------- */
OnvifSoap.prototype.createRequestSoap = function(params) {
	var soap = '';
	soap += '<?xml version="1.0" encoding="UTF-8"?>';
	soap += '<s:Envelope';
	soap += '  xmlns:s="http://www.w3.org/2003/05/soap-envelope"';
	if(params['xmlns'] && Array.isArray(params['xmlns'])) {
		params['xmlns'].forEach((ns) => {
			soap += ' ' + ns;
		});
	}
	soap += '>';
	soap += '<s:Header>';
	if(params['user']) {
		soap += this._createSoapUserToken(params['diff'], params['user'], params['pass']);
	}
	soap += '</s:Header>';
	soap += '<s:Body>' + params['body'] + '</s:Body>';
	soap += '</s:Envelope>';

	soap = soap.replace(/\>\s+\</g, '><');
	return soap;
};

OnvifSoap.prototype._createSoapUserToken = function(diff, user, pass) {
	if(!diff) {diff = 0;}
	if(!pass) {pass = '';}
	var date = (new Date(Date.now() + diff)).toISOString();
	var nonce_buffer = this._createNonce(16);
	var nonce_base64 = nonce_buffer.toString('base64');
	var shasum = mCrypto.createHash('sha1');
	shasum.update(Buffer.concat([nonce_buffer, new Buffer(date), new Buffer(pass)]));
	var digest = shasum.digest('base64');
	var soap = '';
	soap += '<Security s:mustUnderstand="1" xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">';
	soap += '  <UsernameToken>';
	soap += '    <Username>' + user + '</Username>';
	soap += '    <Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">' + digest + '</Password>';
	soap += '    <Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">' + nonce_base64 + '</Nonce>';
	soap += '    <Created xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' + date + '</Created>';
	soap += '  </UsernameToken>';
	soap += '</Security>';
	return soap;
};

OnvifSoap.prototype._createNonce = function(digit) {
	var nonce = new Buffer(digit);
	for(var i=0; i<digit; i++){
		nonce.writeUInt8(Math.floor(Math.random() * 256), i);
	}
	return nonce;
};

/* ------------------------------------------------------------------
* Method: isInvalidValue(value, type, allow_empty)
* - type: 'undefined', 'null', 'array', 'integer', 'float', 'boolean', 'object'
* ---------------------------------------------------------------- */
OnvifSoap.prototype.isInvalidValue = function(value, type, allow_empty) {
	var vt = this._getTypeOfValue(value);
	if(type === 'float') {
		if(!vt.match(/^(float|integer)$/)) {
			return 'The type of the value must be "' + type + '".';
		}
	} else {
		if(vt !== type) {
			return 'The type of the value must be "' + type + '".';
		}
	}

	if(!allow_empty) {
		if(vt === 'array' && value.length === 0) {
			return 'The value must not be an empty array.';
		} else if(vt === 'string' && value === '') {
			return 'The value must not be an empty string.';
		}
	}
	if(typeof(value) === 'string') {
		if(value.match(/[^\x20-\x7e]/)) {
			return 'The value must consist of ascii characters.';
		}
		if(value.match(/[\<\>]/)) {
			return 'Invalid characters were found in the value ("<", ">")';
		}
	}
	return '';
};

OnvifSoap.prototype._getTypeOfValue = function(value) {
	if(value === undefined) {
		return 'undefined';
	} else if(value === null) {
		return 'null';
	} else if(Array.isArray(value)) {
		return 'array';
	}
	var t = typeof(value);
	if(t === 'boolean') {
		return 'boolean';
	} else if(t === 'string') {
		return 'string';
	} else if(t === 'number') {
		if(value % 1 === 0) {
			return 'integer';
		} else {
			return 'float';
		}
	} else if(t === 'object') {
		if(Object.prototype.toString.call(value) === '[object Object]') {
			return 'object';
		} else {
			return 'unknown';
		}
	} else {
		return 'unknown';
	}
}

module.exports = new OnvifSoap();