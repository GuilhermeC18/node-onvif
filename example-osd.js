var onvif = require("./lib/node-onvif")

// get OSDs
const getOSDs = option => {
	let device = new onvif.OnvifDevice({ ...option })
	device
		.init()
		.then(info => {
			let params = {
				ConfigurationToken: device.current_profile.video.source.token
			}
			device.services.media.getOSDs(params).then(res => {
				console.log(JSON.stringify(res["data"]["GetOSDsResponse"]["OSDs"], null, 2))
			})
		})
		.catch(error => {
			console.error(error)
		})
}

// get OSD
const getOSD = (option, OSDToken) => {
	let device = new onvif.OnvifDevice({ ...option })
	device
		.init()
		.then(info => {
			device.services.media.getOSD({ OSDToken }).then(res => {
				console.log(JSON.stringify(res["data"]["GetOSDResponse"], null, 2))
			})
		})
		.catch(error => {
			console.error(error)
		})
}

// get OSDOptions
const getOSDOptions = option => {
	let device = new onvif.OnvifDevice({ ...option })
	device
		.init()
		.then(info => {
			let params = {
				ConfigurationToken: device.current_profile.video.source.token
			}
			device.services.media.getOSDOptions(params).then(res => {
				console.log(JSON.stringify(res["data"]["GetOSDOptionsResponse"]["OSDOptions"], null, 2))
			})
		})
		.catch(error => {
			console.error(error)
		})
}
// set OSD
const setOSD = (option, params) => {
	let device = new onvif.OnvifDevice({ ...option })
	device
		.init()
		.then(info => {
			params.VideoSourceConfigurationToken = device.current_profile.video.source.token
			device.services.media
				.setOSD(params)
				.then(res => {
					console.log(JSON.stringify(res["data"], null, 2))
				})
				.catch(err => console.log(err))
		})
		.catch(error => {
			console.error(error)
		})
}
// create OSD
const createOSD = option => {
	fs.readFile("./osd.xml", (err, data) => {
		var osdString = data.toString()
		let device = new onvif.OnvifDevice({ ...option })
		device
			.init()
			.then(info => {
				let params = {
					VideoSourceConfigurationToken: device.current_profile.video.source.token
				}
				device.services.media
					.createOSD(params)
					.then(res => {
						console.log(JSON.stringify(res["data"], null, 2))
					})
					.catch(err => console.log(err))
			})
			.catch(error => {
				console.error(error)
			})
	})
}
// delete OSD
const deleteOSD = (option, OSDToken) => {
	let device = new onvif.OnvifDevice({ ...option })
	device
		.init()
		.then(info => {
			let params = {
				OSDToken
			}
			device.services.media.deleteOSD(params).then(res => {
				console.log(JSON.stringify(res["data"], null, 2))
			})
		})
		.catch(error => {
			console.error(error)
		})
}

// media.getSnapshotUri
const getSnapshotUri = option => {
	let device = new onvif.OnvifDevice({ ...option })
	device
		.init()
		.then(info => {
			let params = {
				ProfileToken: device.profile_list[0].token
			}
			device.services.media.getSnapshotUri(params).then(res => {
				console.log(JSON.stringify(res["data"], null, 2))
			})
		})
		.catch(error => {
			console.error(error)
		})
}

let xaddr = "http://192.168.100.70/onvif/device_service" //"http://192.168.98.66/onvif/device_service" //
let user = "admin"
let pass = "admin1234" //"admin123" //

// ptz({ xaddr, user, pass }, { x: 1.0 })

// GetDeviceInfo({ xaddr, user, pass })
getOSDs({ xaddr, user, pass })
// getSnapshotUri({ xaddr, user, pass })
// getOSD({ xaddr, user, pass }, "OsdToken_102")
// getOSDOptions({ xaddr, user, pass })
// setOSD(
//   { xaddr, user, pass },
//   {
//     OSDToken: "OsdToken_104",
//     OSDText: "北京可视通!!!"
//   }
// )
// deleteOSD({ xaddr, user, pass }, "OsdToken_104")
// createOSD({ xaddr, user, pass })
// getUsers({ xaddr, user, pass })
// createUsers({ xaddr, user, pass })
