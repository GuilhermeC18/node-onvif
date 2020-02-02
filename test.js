const onvif  = require('./lib/node-onvif');

console.log('Start the discovery process.');

let device = new onvif.OnvifDevice({
    xaddr: 'http://192.168.1.48:2000/onvif/device_service',
    user : 'admin',
    pass : 'admin'
});
// Initialize the OnvifDevice object
device.init().then((info) => {
   
    device.services.media.getProfiles(function(error, profiles){
        for (let i=0; i<profiles.data.GetProfilesResponse.Profiles.length; i++){
            console.log(profiles.data.GetProfilesResponse.Profiles[i].Name);
            console.log(profiles.data.GetProfilesResponse.Profiles[i].$.token);
        }
        //console.log(profiles.data.GetProfilesResponse.Profiles.length);
    });

    device.services.media.getStreamUri({ProfileToken: "SubStreamToken", Protocol: "RTSP"}, function(error, stream){
        console.log(stream.data.GetStreamUriResponse.MediaUri.Uri);
    });

    }).catch((error) => {
    console.error(error);
  });  
    
  
  /*

   // Show the detailed information of the device.
    device.services.device.getNetworkInterfaces(function(error, value){
    
        
        console.log(value.data.GetNetworkInterfacesResponse.NetworkInterfaces);

    
    })
    console.log(JSON.stringify(info, null, '  '));

    console.log(device.getCurrentProfile());

    console.log(device.getUdpStreamUrl());
    let ptz = device.services.ptz;
    if(!ptz) {
      throw new Error('Your ONVIF network camera does not support the PTZ service.');
    }
    let imaging = device.services.imaging;
    if(!imaging) {
      throw new Error('Your ONVIF network camera does not support the Imaging service.');
    }
    let media = device.services.media;
    media.getVideoSources(function(error, message){
        
        imaging.setImagingSettings({
            "VideoSourceToken" : message.data.GetVideoSourcesResponse.VideoSources['$'].token,
            "IrCutFilter": "ON",
            "Iris": 200
        }, function(error, data){
            console.log(error);
            //console.log(data);
            imaging.getImagingSettings({
                "VideoSourceToken" : message.data.GetVideoSourcesResponse.VideoSources['$'].token,
            }, function(error, result){
                console.log(result.data.GetImagingSettingsResponse.ImagingSettings);
            });
        })

        imaging.getOptions({
            "VideoSourceToken" : message.data.GetVideoSourcesResponse.VideoSources['$'].token,
        }, function(error, result){
            //console.log(result.data.GetOptionsResponse.ImagingOptions);
        });
    });

    */