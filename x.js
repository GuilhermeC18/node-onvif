const onvif = require('node-onvif');

// Create an OnvifDevice object
let device = new onvif.OnvifDevice({
  xaddr: 'http://10.10.10.3/onvif/device_service',
  user : 'admin',
  pass : 'blackoffice2MX',
});

// Initialize the OnvifDevice object
device.init().then(() => {
  // Move the camera
  return device.ptzMove({
    'speed': {
        
      x: 0.5, // Speed of pan (in the range of -1.0 to 1.0)
      y: 0.0, // Speed of tilt (in the range of -1.0 to 1.0)
      z: 0.0  // Speed of zoom (in the range of -1.0 to 1.0)
    },
    'timeout': 2 // seconds
  });

}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
