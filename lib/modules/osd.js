"use strict"
const mUrl = require("url")
const mOnvifSoap = require("./soap.js")

function osd(OnvifServiceMedia){
/* ------------------------------------------------------------------
 * Method: getOSDs(params[, callback])
 * - params:
 *   - ConfigurationToken | String | required | a token of the Profile
 *
 * {
 *   'ConfigurationToken': 'Profile1'
 * }
 * ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getOSDs = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = ""
		if ((err_msg = mOnvifSoap.isInvalidValue(params, "object"))) {
			reject(new Error('The value of "params" was invalid: ' + err_msg))
			return
		}

		if ((err_msg = mOnvifSoap.isInvalidValue(params["ConfigurationToken"], "string"))) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg))
			return
		}

		let soap_body = ""
		soap_body += "<trt:GetOSDs>"
		soap_body +=
			"<trt:ConfigurationToken>" + params["ConfigurationToken"] + "</trt:ConfigurationToken>"
		soap_body += "</trt:GetOSDs>"
		let soap = this._createRequestSoap(soap_body)

		mOnvifSoap
			.requestCommand(this.oxaddr, "GetOSDs", soap)
			.then(result => {
				resolve(result)
			})
			.catch(error => {
				reject(error)
			})
	})
	if (callback) {
		promise
			.then(result => {
				callback(null, result)
			})
			.catch(error => {
				callback(error)
			})
	} else {
		return promise
	}
}

/* ------------------------------------------------------------------
 * Method: getOSD(params[, callback])
 * - params:
 *   - OSDToken | String | required | a token of the Profile
 *
 * {
 *   'OSDToken': 'Profile1'
 * }
 * ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getOSD = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = ""
		if ((err_msg = mOnvifSoap.isInvalidValue(params, "object"))) {
			reject(new Error('The value of "params" was invalid: ' + err_msg))
			return
		}

		if ((err_msg = mOnvifSoap.isInvalidValue(params["OSDToken"], "string"))) {
			reject(new Error('The "OSDToken" property was invalid: ' + err_msg))
			return
		}

		let soap_body = ""
		soap_body += "<trt:GetOSD>"
		soap_body += "<trt:OSDToken>" + params["OSDToken"] + "</trt:OSDToken>"
		soap_body += "</trt:GetOSD>"
		let soap = this._createRequestSoap(soap_body)
		mOnvifSoap
			.requestCommand(this.oxaddr, "GetOSD", soap)
			.then(result => {
				resolve(result)
			})
			.catch(error => {
				reject(error)
			})
	})
	if (callback) {
		promise
			.then(result => {
				callback(null, result)
			})
			.catch(error => {
				callback(error)
			})
	} else {
		return promise
	}
}

/* ------------------------------------------------------------------
 * Method: getOSDOptions(params[, callback])
 * - params:
 *   - ConfigurationToken | String | required | a token of the Profile
 *
 * {
 *   'ConfigurationToken': 'Profile1'
 * }
 * ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.getOSDOptions = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = ""
		if ((err_msg = mOnvifSoap.isInvalidValue(params, "object"))) {
			reject(new Error('The value of "params" was invalid: ' + err_msg))
			return
		}

		if ((err_msg = mOnvifSoap.isInvalidValue(params["ConfigurationToken"], "string"))) {
			reject(new Error('The "ConfigurationToken" property was invalid: ' + err_msg))
			return
		}

		let soap_body = ""
		soap_body += "<trt:GetOSDOptions>"
		soap_body +=
			"<trt:ConfigurationToken>" + params["ConfigurationToken"] + "</trt:ConfigurationToken>"
		soap_body += "</trt:GetOSDOptions>"
		let soap = this._createRequestSoap(soap_body)

		mOnvifSoap
			.requestCommand(this.oxaddr, "GetOSDOptions", soap)
			.then(result => {
				resolve(result)
			})
			.catch(error => {
				reject(error)
			})
	})
	if (callback) {
		promise
			.then(result => {
				callback(null, result)
			})
			.catch(error => {
				callback(error)
			})
	} else {
		return promise
	}
}

/* ------------------------------------------------------------------
 * Method: setOSD(params[, callback])
 * - params:
 *   - VideoSourceConfigurationToken | String | required | a token of the Profile
 *   - OSDToken | String | required | a token of the Profile
 *   - OSDText | String | required | a Osd text of the Profile
 *
 * {
 *   'VideoSourceConfigurationToken': 'Profile1',
 *   'OSDToken': 'Profile2',
 *   'OSDText':"Profile3"
 *
 * }
 * ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.setOSD = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = ""
		if ((err_msg = mOnvifSoap.isInvalidValue(params, "object"))) {
			reject(new Error('The value of "params" was invalid: ' + err_msg))
			return
		}

		if ((err_msg = mOnvifSoap.isInvalidValue(params["OSDToken"], "string"))) {
			reject(new Error('The "OSDToken" property was invalid: ' + err_msg))
			return
		}

		if ((err_msg = mOnvifSoap.isInvalidValue(params["VideoSourceConfigurationToken"], "string"))) {
			reject(new Error('The "VideoSourceConfigurationToken" property was invalid: ' + err_msg))
			return
		}

		let soap_body = `<trt:SetOSD>
    <trt:OSD token="${params["OSDToken"]}">
    <tt:VideoSourceConfigurationToken>${
			params["VideoSourceConfigurationToken"]
		}</tt:VideoSourceConfigurationToken>
    <tt:Type>Text</tt:Type>
    <tt:Position>
        <tt:Type>Custom</tt:Type>
        <tt:Pos x="0.818182" y="0.888889"/>
    </tt:Position>
    <tt:TextString>
        <tt:Type>Plain</tt:Type>
        <tt:PlainText>${params["OSDText"]}</tt:PlainText>
    </tt:TextString>
</trt:OSD>
    </trt:SetOSD>`

		let soap = this._createRequestSoap(soap_body)
		mOnvifSoap
			.requestCommand(this.oxaddr, "SetOSD", soap)
			.then(result => {
				resolve(result)
			})
			.catch(error => {
				reject(error)
			})
	})
	if (callback) {
		promise
			.then(result => {
				callback(null, result)
			})
			.catch(error => {
				callback(error)
			})
	} else {
		return promise
	}
}

/* ------------------------------------------------------------------
 * Method: createOSD(params[, callback])
 * - params:
 *   - VideoSourceConfigurationToken | String | required | a token of the Profile
 *
 * {
 *    'VideoSourceConfigurationToken': 'Profile1'
 *
 * }
 * ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.createOSD = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = ""
		if ((err_msg = mOnvifSoap.isInvalidValue(params, "object"))) {
			reject(new Error('The value of "params" was invalid: ' + err_msg))
			return
		}

		if ((err_msg = mOnvifSoap.isInvalidValue(params["VideoSourceConfigurationToken"], "string"))) {
			reject(new Error('The "OSDToken" property was invalid: ' + err_msg))
			return
		}

		let soap_body = `
<trt:CreateOSD>
  <trt:OSD token="">
    <tt:VideoSourceConfigurationToken>${
			params["VideoSourceConfigurationToken"]
		}</tt:VideoSourceConfigurationToken>
    <tt:Type>Text</tt:Type>
    <tt:Position>
        <tt:Type>Custom</tt:Type>
        <tt:Pos x="-1.0" y="0.8"/>
    </tt:Position>
    <tt:TextString>
        <tt:Type>Plain</tt:Type>
        <tt:PlainText>OSD-KST!</tt:PlainText>
    </tt:TextString>
  </trt:OSD>
</trt:CreateOSD>
    `

		let soap = this._createRequestSoap(soap_body)
		mOnvifSoap
			.requestCommand(this.oxaddr, "CreateOSD", soap)
			.then(result => {
				resolve(result)
			})
			.catch(error => {
				reject(error)
			})
	})
	if (callback) {
		promise
			.then(result => {
				callback(null, result)
			})
			.catch(error => {
				callback(error)
			})
	} else {
		return promise
	}
}

/* ------------------------------------------------------------------
 * Method: deleteOSD(params[, callback])
 * - params:
 *   - OSDToken | String | required | a token of the Profile
 *
 * {
 *   'OSDToken': 'Profile1'
 * }
 * ---------------------------------------------------------------- */
OnvifServiceMedia.prototype.deleteOSD = function(params, callback) {
	let promise = new Promise((resolve, reject) => {
		let err_msg = ""
		if ((err_msg = mOnvifSoap.isInvalidValue(params, "object"))) {
			reject(new Error('The value of "params" was invalid: ' + err_msg))
			return
		}

		if ((err_msg = mOnvifSoap.isInvalidValue(params["OSDToken"], "string"))) {
			reject(new Error('The "OSDToken" property was invalid: ' + err_msg))
			return
		}

		let soap_body = ""
		soap_body += "<trt:DeleteOSD>"
		soap_body += "<trt:OSDToken>" + params["OSDToken"] + "</trt:OSDToken>"
		soap_body += "</trt:DeleteOSD>"
		let soap = this._createRequestSoap(soap_body)
		mOnvifSoap
			.requestCommand(this.oxaddr, "DeleteOSD", soap)
			.then(result => {
				resolve(result)
			})
			.catch(error => {
				reject(error)
			})
	})
	if (callback) {
		promise
			.then(result => {
				callback(null, result)
			})
			.catch(error => {
				callback(error)
			})
	} else {
		return promise
	}
}

}

module.exports = osd
