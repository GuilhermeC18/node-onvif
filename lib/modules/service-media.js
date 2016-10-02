/* ------------------------------------------------------------------
* node-onvif - service-media.js
*
* Copyright (c) 2016, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2016-10-02
* ---------------------------------------------------------------- */
'use strict';
var mUrl    = require('url');

var mOnvifSoap = require('./soap.js');

/* ------------------------------------------------------------------
* Constructor: OnvifServiceMedia(params)
* - params:
*    - xaddr   : URL of the entry point for the media service
*                (Required)
*    - user  : User name (Optional)
*    - pass  : Password (Optional)
*    - time_diff: ms
* ---------------------------------------------------------------- */
var OnvifServiceMedia = function(params) {
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

	this.time_diff = params['time_diff'];
	this.name_space_attr_list = [
		'xmlns:trt="http://www.onvif.org/ver10/media/wsdl"',
		'xmlns:tt="http://www.onvif.org/ver10/schema"'
	];
};

OnvifServiceMedia.prototype._createRequestSoap = function(body) {
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
OnvifServiceMedia.prototype.setAuth = function(user, pass) {
	this.user = user || '';
	this.pass = pass || '';
	if(this.user) {
		this.oxaddr.auth = this.user + ':' + this.pass;
	} else {
		this.oxaddr.auth = '';
	}
};

/* ------------------------------------------------------------------
* Method: getStreamUri(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the profile
*   - Protocol     | String | required | "UDP", "HTTP", or "RTSP"
*
* {
*   'ProfileToken': 'Profile1,
*   'Protocol'    : 'UDP'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getStreamUri = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['Protocol'], 'string')) {
		callback(new Error('The "Protocol" property was invalid: ' + err_msg));
		return;
	} else if(!params['Protocol'].match(/^(UDP|HTTP|RTSP)$/)) {
		callback(new Error('The "Protocol" property was invalid: The value must be either "UDP", "HTTP", or "RTSP".'));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetStreamUri>';
	soap_body +=   '<trt:StreamSetup>';
	soap_body +=     '<tt:Stream>RTP-Unicast</tt:Stream>';
	soap_body +=     '<tt:Transport>';
	soap_body +=       '<tt:Protocol>' + params['Protocol'] + '</tt:Protocol>';
	soap_body +=     '</tt:Transport>';
	soap_body +=   '</trt:StreamSetup>';
	soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:GetStreamUri>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetStreamUri', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getVideoEncoderConfigurations(callback)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoEncoderConfigurations = function(callback) {
	var callbackError = function(msg) {
		var err = new Error(msg);
		callback(err);
	};

	var soap_body = '';
	soap_body += '<trt:GetVideoEncoderConfigurations />';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoEncoderConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getVideoEncoderConfiguration(params, callback)
* - params:
*   - ConfigurationToken | String | required | a token of the configuration
*
* {
*   'ConfigurationToken': 'Configuration1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoEncoderConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetVideoEncoderConfiguration>';
	soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:GetVideoEncoderConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoEncoderConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getCompatibleVideoEncoderConfigurations(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleVideoEncoderConfigurations = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetCompatibleVideoEncoderConfigurations>';
	soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:GetCompatibleVideoEncoderConfigurations>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleVideoEncoderConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getVideoEncoderConfigurationOptions(params, callback)
* - params:
*   - ProfileToken       | String | optional | a token of the profile
*   - ConfigurationToken | String | optional | a token of the configuration
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoEncoderConfigurationOptions = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if('ProfileToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}
	}

	if('ConfigurationToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<trt:GetVideoEncoderConfigurationOptions>';
	if(params['ProfileToken']) {
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	}
	if(params['ConfigurationToken']) {
		soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	}
	soap_body += '</trt:GetVideoEncoderConfigurationOptions>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoEncoderConfigurationOptions', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getGuaranteedNumberOfVideoEncoderInstances(params, callback)
* - params:
*   - ConfigurationToken | String | required | a token of the configuration
*
* {
*   'ConfigurationToken': 'Configuration1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getGuaranteedNumberOfVideoEncoderInstances = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetGuaranteedNumberOfVideoEncoderInstances>';
	soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:GetGuaranteedNumberOfVideoEncoderInstances>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetGuaranteedNumberOfVideoEncoderInstances', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getProfiles(callback)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getProfiles = function(callback) {
	var soap_body = '<trt:GetProfiles/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetProfiles', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getProfile(params, callback)
* - params:
*   - ProfileToken | required | a token of the profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getProfile = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetProfile>';
	soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:GetProfile>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetProfile', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: createProfile(params, callback)
* - params:
*   - Name  | String | required | a name of the profile
*   - Token | String | optional | a token of the profile
*
* {
*   'Name: 'TestProfile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.createProfile = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['Name'], 'string')) {
		callback(new Error('The "Name" property was invalid: ' + err_msg));
		return;
	}

	if('Token' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['Token'], 'string')) {
			callback(new Error('The "Token" property was invalid: ' + err_msg));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<trt:CreateProfile>';
	soap_body +=   '<trt:Name>' + params['Name'] + '</trt:Name>';
	if('Token' in params) {
		soap_body +=   '<trt:Token>' + params['Token'] + '</trt:Token>';
	}
	soap_body += '</trt:CreateProfile>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'CreateProfile', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: deleteProfile(params, callback)
* - params:
*   - ProfileToken | String | required | 
*
* {
*   'ProfileToken: 'TestProfile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.deleteProfile = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:DeleteProfile>';
	soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:DeleteProfile>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'DeleteProfile', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getVideoSources(callback)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoSources = function(callback) {
	var soap_body = '<trt:GetVideoSources/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoSources', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getVideoSourceConfiguration(params, callback)
* - params:
*   - ConfigurationToken | String | required | 
*
* {
*   'ConfigurationToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoSourceConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetVideoSourceConfiguration>';
	soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:GetVideoSourceConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoSourceConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getVideoSourceConfigurations(callback)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoSourceConfigurations = function(callback) {
	var soap_body = '<trt:GetVideoSourceConfigurations/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoSourceConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: addVideoSourceConfiguration(params, callback)
* - params:
*   - ProfileToken       | String | required | a token of the Profile
*   - ConfigurationToken | String | required | 
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Profile1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addVideoSourceConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:AddVideoSourceConfiguration>';
	soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:AddVideoSourceConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'AddVideoSourceConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getCompatibleVideoSourceConfigurations(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the targeted PTZ node
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleVideoSourceConfigurations = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetCompatibleVideoSourceConfigurations>';
	soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:GetCompatibleVideoSourceConfigurations>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleVideoSourceConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getVideoSourceConfigurationOptions(params, callback)
* - params:
*   - ProfileToken       | optional | a token of the Profile
*   - ConfigurationToken | optional | a token of the configuration
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getVideoSourceConfigurationOptions = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if('ProfileToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}
	}

	if('ConfigurationToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<trt:GetVideoSourceConfigurationOptions>';
	if('ProfileToken' in params) {
		soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	}
	if('ConfigurationToken' in params) {
		soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	}
	soap_body += '</trt:GetVideoSourceConfigurationOptions>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetVideoSourceConfigurationOptions', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getMetadataConfiguration(params, callback)
* - params:
*   - ConfigurationToken | required | 
*
* {
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getMetadataConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetMetadataConfiguration>';
	soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:GetMetadataConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetMetadataConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getMetadataConfigurations(callback)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getMetadataConfigurations = function(callback) {
	var soap_body = '<trt:GetMetadataConfigurations/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetMetadataConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: addMetadataConfiguration(params, callback)
* - params:
*   - ProfileToken       | String | required | a token of the Profile
*   - ConfigurationToken | String | required | 
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addMetadataConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:AddMetadataConfiguration>';
	soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body +=   '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:AddMetadataConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'AddMetadataConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getCompatibleMetadataConfigurations(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the Profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleMetadataConfigurations = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetCompatibleMetadataConfigurations>';
	soap_body +=   '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:GetCompatibleMetadataConfigurations>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleMetadataConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getMetadataConfigurationOptions(params, callback)
* - params:
*   - ProfileToken       | String | optional | a token of the Profile
*   - ConfigurationToken | String | optional | 
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getMetadataConfigurationOptions = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if('ProfileToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}
	}

	if('ConfigurationToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<trt:GetMetadataConfigurationOptions>';
	if('ProfileToken' in params) {
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	}
	if('ConfigurationToken' in params) {
		soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	}
	soap_body += '</trt:GetMetadataConfigurationOptions>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetMetadataConfigurationOptions', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getAudioSources(callback)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioSources = function(callback) {
	var soap_body = '<trt:GetAudioSources/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioSources', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getAudioSourceConfiguration(params, callback)
* - params:
*   - ConfigurationToken | String | required | 
*
* {
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioSourceConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetAudioSourceConfiguration>';
	soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:GetAudioSourceConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioSourceConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getAudioSourceConfigurations(callback)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioSourceConfigurations = function(callback) {
	var soap_body = '<trt:GetAudioSourceConfigurations/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioSourceConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: addAudioSourceConfiguration(params, callback)
* - params:
*   - ProfileToken       | String | required | a token of the Profile
*   - ConfigurationToken | String | required |  
*
* {
*   'ProfileToken': 'Profile1',
*   'ConfigurationToken': 'Conf1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addAudioSourceConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:AddAudioSourceConfiguration>';
	soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:AddAudioSourceConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'AddAudioSourceConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getCompatibleAudioSourceConfigurations(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleAudioSourceConfigurations = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetCompatibleAudioSourceConfigurations>';
	soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:GetCompatibleAudioSourceConfigurations>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleAudioSourceConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getAudioSourceConfigurationOptions(params, callback)
* - params:
*   - ProfileToken       | String | optional | a token of the Profile
*   - ConfigurationToken | String | optional | 
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioSourceConfigurationOptions = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if('ProfileToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}
	}

	if('ConfigurationToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<trt:GetAudioSourceConfigurationOptions>';
	if('ProfileToken' in params) {
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	}
	if('ConfigurationToken' in params) {
		soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	}
	soap_body += '</trt:GetAudioSourceConfigurationOptions>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioSourceConfigurationOptions', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getAudioEncoderConfiguration(params, callback)
* - params:
*   - ConfigurationToken | String | required | 
*
* {
*   'ConfigurationToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioEncoderConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetAudioEncoderConfiguration>';
	soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:GetAudioEncoderConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioEncoderConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getAudioEncoderConfigurations(callback)
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioEncoderConfigurations = function(callback) {
	var soap_body = '<trt:GetAudioEncoderConfigurations/>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioEncoderConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: addAudioEncoderConfiguration(params, callback)
* - params:
*   - ProfileToken       | String | required | a token of the Profile
*   - ConfigurationToken | String | required |  
*
* {
*   'ProfileToken': 'Profile1',
*   'ConfigurationToken': 'Conf1'
* }
*
* Not device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.addAudioEncoderConfiguration = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
		callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:AddAudioEncoderConfiguration>';
	soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	soap_body += '</trt:AddAudioEncoderConfiguration>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'AddAudioEncoderConfiguration', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getCompatibleAudioEncoderConfigurations(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getCompatibleAudioEncoderConfigurations = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetCompatibleAudioEncoderConfigurations>';
	soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:GetCompatibleAudioEncoderConfigurations>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetCompatibleAudioEncoderConfigurations', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getAudioEncoderConfigurationOptions(params, callback)
* - params:
*   - ProfileToken       | String | optional | a token of the Profile
*   - ConfigurationToken | String | optional | 
*
* {
*   'ProfileToken': 'Profile1'
*   'ConfigurationToken': 'Conf1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getAudioEncoderConfigurationOptions = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if('ProfileToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
			callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
			return;
		}
	}

	if('ConfigurationToken' in params) {
		if(err_msg = mOnvifSoap.isInvalidValue(params['ConfigurationToken'], 'string')) {
			callback(new Error('The "ConfigurationToken" property was invalid: ' + err_msg));
			return;
		}
	}

	var soap_body = '';
	soap_body += '<trt:GetAudioEncoderConfigurationOptions>';
	if('ProfileToken' in params) {
		soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	}
	if('ConfigurationToken' in params) {
		soap_body += '<trt:ConfigurationToken>' + params['ConfigurationToken'] + '</trt:ConfigurationToken>';
	}
	soap_body += '</trt:GetAudioEncoderConfigurationOptions>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetAudioEncoderConfigurationOptions', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: startMulticastStreaming(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the Profile
*
* {
*   'ProfileToken': 'Profile1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.startMulticastStreaming = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:StartMulticastStreaming>';
	soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:StartMulticastStreaming>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'StartMulticastStreaming', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: stopMulticastStreaming(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the Profile
*
* {
*   'ProfileToken': 'Profile1'
* }
*
* No device I own does not support this command
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.stopMulticastStreaming = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:StopMulticastStreaming>';
	soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:StopMulticastStreaming>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'StopMulticastStreaming', soap, (error, result) => {
		callback(error, result);
	});
};

/* ------------------------------------------------------------------
* Method: getSnapshotUri(params, callback)
* - params:
*   - ProfileToken | String | required | a token of the Profile
*
* {
*   'ProfileToken': 'Profile1'
* }
* ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getSnapshotUri = function(params, callback) {
	var err_msg = '';
	if(err_msg = mOnvifSoap.isInvalidValue(params, 'object')) {
		callback(new Error('The value of "params" was invalid: ' + err_msg));
		return;
	}

	if(err_msg = mOnvifSoap.isInvalidValue(params['ProfileToken'], 'string')) {
		callback(new Error('The "ProfileToken" property was invalid: ' + err_msg));
		return;
	}

	var soap_body = '';
	soap_body += '<trt:GetSnapshotUri>';
	soap_body += '<trt:ProfileToken>' + params['ProfileToken'] + '</trt:ProfileToken>';
	soap_body += '</trt:GetSnapshotUri>';
	var soap = this._createRequestSoap(soap_body);

	mOnvifSoap.requestCommand(this.oxaddr, 'GetSnapshotUri', soap, (error, result) => {
		callback(error, result);
	});
};


module.exports = OnvifServiceMedia;








