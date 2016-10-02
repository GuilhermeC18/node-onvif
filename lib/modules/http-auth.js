/* ------------------------------------------------------------------
* node-onvif - http-auth.js
*
* Copyright (c) 2016, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2016-10-02
* ---------------------------------------------------------------- */
'use strict';
var mHttp   = require('http');
var mHttps  = require('https');
var mCrypto = require('crypto');

/* ------------------------------------------------------------------
* Constructor: OnvifHttpAuth()
* ---------------------------------------------------------------- */
var OnvifHttpAuth = function() {
	this.user = '';
	this.pass = '';
	this.method = '';
	this.path = '';
	this.nonce_count = 0;
	this.options = null;
};

/* ------------------------------------------------------------------
* Method: request(options, callback)
* ---------------------------------------------------------------- */
OnvifHttpAuth.prototype.request = function(options, callback) {
	this.options = JSON.parse(JSON.stringify(options))
	var http = (options && options.protocol === 'https:') ? mHttps : mHttp;
	if(options.auth && typeof(options.auth) === 'string') {
		var pair = options.auth.split(':');
		this.user = pair[0];
		this.pass = pair[1];
	}
	//delete options.auth;
	if(options.method && typeof(options.method) === 'string') {
		this.method = options.method.toUpperCase();
	} else {
		this.method = 'GET';
	}
	if(options.path && typeof(options.path) === 'string') {
		this.path = options.path;
	}
	var req = http.request(options, (res) => {
		if(res.statusCode === 401 && res.headers['www-authenticate']) {
			if(res.headers['www-authenticate'].match(/Digest realm/)) {
				this._handleHttpDigest(http, res, callback);
			} else {
				callback(res);
			}
		} else {
			callback(res);
		}
	});
	return req;
};

OnvifHttpAuth.prototype._handleHttpDigest = function(http, res, callback) {
	var o = this._parseAuthHeader(res.headers['www-authenticate']);
	if(!this.options.headers) {
		this.options.headers = {};
	}
	this.options.headers['Authorization'] = this._createAuthReqHeaderValue(o);
	var req = http.request(this.options, callback);
	req.end();
};

OnvifHttpAuth.prototype._createAuthReqHeaderValue = function(o) {
	var ha1 = this._createHash(o.algorithm, [this.user, o['Digest realm'], this.pass].join(':'));
	var ha2 = this._createHash(o.algorithm, [this.method, this.path].join(':'));
	var cnonce = this._createCnonce(8);
	this.nonce_count ++;
	var nc = ('0000000' + this.nonce_count.toString(16)).slice(-8);
	var response = this._createHash(o.algorithm, [ha1, o.nonce, nc, cnonce, o.qop, ha2].join(':'));

	var hvalue = [
		'username="' + this.user + '"',
		'realm="' + o['Digest realm'] + '"',
		'nonce="' + o.nonce + '"',
		'uri="' + this.path + '"',
		'algorithm=' + o.algorithm,
		'qop=' + o.qop,
		'nc=' + nc,
		'cnonce="' + cnonce + '"',
		'response="' + response + '"'
	].join(', ');
	hvalue = 'Digest ' + hvalue;
	return hvalue;
};

OnvifHttpAuth.prototype._createCnonce = function(digit) {
	var nonce = new Buffer(digit);
	for(var i=0; i<digit; i++){
		nonce.writeUInt8(Math.floor(Math.random() * 256), i);
	}
	return nonce.toString('hex');
};

OnvifHttpAuth.prototype._createHash = function(algo, data) {
	var hash = null;
	if(algo === 'MD5') {
		hash = mCrypto.createHash('md5');
	} else {
		hash = mCrypto.createHash('sha256');
	}
	hash.update(data, 'utf8');
	return hash.digest('hex');
};

OnvifHttpAuth.prototype._parseAuthHeader = function(h) {
	var o = {};
	h.split(/,\s*/).forEach((s) => {
		var pair = s.split('=');
		var k = pair[0];
		var v = pair[1];
		if(!k || !v) {
			return;
		}
		v = v.replace(/^\"/, '');
		v = v.replace(/\"$/, '');
		o[k] = v;
	});
	if(!o['algorithm']) { // workaround for DBPOWER
		o['algorithm'] = 'MD5';
	}
	return o;
};

module.exports = new OnvifHttpAuth();