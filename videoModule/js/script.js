var client; 
var screenClient; 
var localTracks = {
  videoTrack: null,
  audioTrack: null
};
var localScreenTracks = {
    videoTrack: null,
    // audioTrack: null
  };
  var remoteUsers = {};
  // Agora client options
  var options = {
    appid: "141d75a8f7d24d5cb92d9d6ff6a41aa7",
    channel: "navishk",
    uid: null,
    token: "006141d75a8f7d24d5cb92d9d6ff6a41aa7IABroGuAmiAC8L89KUTcQFGLLhaHa9mqqj0y3+6wJt5YEakWApQAAAAAEADikULNa0YNXwEAAQBrRg1f"
  };

var localStatus = {
  camera: false,
  mic: false,
  screenShare: false
}
$(async() => {
    $("body").on("click", "#card", function () {
        let curr = $(this);
        curr.removeClass("animate__slideInLeft");
        curr.addClass("animate__shakeX");
        curr.css("animation-delay", "0s");
        setTimeout(function () {
            curr.removeClass("animate__shakeX");
            console.log("ss");
        }, 2000);
    });

    $("body").on("click", "#likeVideo", function () {
        $("#liked img").addClass("likeing");

        setTimeout(function () {
            $("#liked img").removeClass("likeing");
        }, 1000);
    });

    // code to hide video loader start
    // setTimeout(function () {
    //     $(".videoLoader").remove();
    // }, 3000);
    // code to hide video loader end

    // code to show videoNotFound start
    // setTimeout(function () {
    //     $(".videoNotFound").show();
    // }, 5000);
    // code to show videoNotFound end
    var urlParams = new URL(location.href).searchParams;
    options.role =  urlParams.get("role");
    options.name =  urlParams.get("name")

    if (options.appid && options.channel && options.token) {
        await join();
    }
});





// const ServerURL = 'http://localhost:4000/users';
const ServerURL = 'https://socket.kidatcode.com/users';
const getRequest = async(data) => {
  const route = `${ServerURL}/getUserInfo`;
  return new Promise((resolve, reject) => {
    $.ajax({
      url: route,
      headers: {
          'Content-Type':'application/json'
      },
      type: 'GET',
      data: data,
      success: function(data) {
        resolve(data)
      },
      error: function(error) {
        reject(error)
      },
    })
  })
}



const videoJoin = async(client, userData, localTracks) => {
    options.userId = userData._id;
    if(userData.role == 'host'){
      $("#local_stream").html("");
      $("#hostName").html(userData.name);
      if(localTracks.videoTrack && localTracks.audioTrack ){
        $("#local_stream").html("<div class='centerAlign' id='remote_video_"+userData.uid+"'></div>");
        localTracks.videoTrack.play("remote_video_"+userData.uid);
        await client.publish(Object.values(localTracks));
        localStatus.camera = true;
        localStatus.audio = true;
      }
      else if(localTracks.audioTrack)
      {
        // localTracks.audioTrack.play();
        $(".me").show();
        $("#me").html((userData.name.substring(0, 2)).toUpperCase());
        await client.publish(localTracks.audioTrack);
        $(".cemera").addClass("disabledbutton");
        localStatus.camera = false;
        localStatus.audio = true;
      }
      else{
        alert("Sorry, you cannot join this without audio");
        location.href = "https://smartnav.github.io/videoclass/videoModule/index.html";
      }
      $(".videoLoader").remove();
    }else{
      let student_stream = $(`<div
      class="suggestedVideoBox animate__animated animate__slideInLeft"
      style="--animationDelay: 1.75s;" id="player-wrapper${userData.uid}">
      <div class="thumbnail">
          <div class="videoLoader" id="video-loader${userData.uid}"></div>
          <div class="videoNotFound" id="video-not-found${userData.uid}" style="display: none;">
              <span class="small" id="videoNotFound${userData.uid}">JD</span>
          </div>
          <div class="instructorName" id="only-name${userData.uid}">
              ${userData.name}
          </div>
          <div style="height: 120px;" id="me${userData.uid}"></div>
        </div>
        </div>`
        )
        $("#remote-playerlist").append(student_stream);
        localTracks.videoTrack.play("me"+userData.uid);
        $("#video-loader"+userData.uid).remove();
    //   $("<div class='remoteName' id= 'me_"+userData.uid+"'>"+userData.name+"</div><div class='player-remote' id= 'me'></div>").appendTo("#remote-playerlist");
      //localTracks.videoTrack.play("me");
        await client.publish(Object.values(localTracks));
    }
  }

  const screenJoin = async(screenClient, userData, localScreenTracks) => {
    if(userData.role == 'host'){
      localTracks.videoTrack.stop("remote_video_"+options.uid);

      $("#local_stream").hide();
      $(".me").hide();
      $("#local_stream_screen").show();
      $("#local_stream_screen").html("");
      $("#local_stream_screen").html("<div class='centerAlignScreen' id='remote_video_screen_"+userData.screenid+"'></div>");
      localScreenTracks.videoTrack.play("remote_video_screen_"+userData.screenid);
      await screenClient.publish(localScreenTracks.videoTrack);
      localStatus.screenShare = true;
      localStatus.audio = true;
    }else{
      alert("You are not authorized to share your screen.")
    } 
  }




  async function join() {
    // create Agora client
    client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
    // add event listener to play remote tracks when remote user publishs.
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    options.uid = await client.join(options.appid, options.channel, options.token || null);
    try {
      localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    } catch (error) {
      localTracks.audioTrack = null;
    }
    try {
      localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack(
        {
          encoderConfig: options.role == 'host' ? "480p_1" : "120p_1"
        }
        );
    } catch (error) {
      localTracks.videoTrack = null;
    }
    
    // join a channel and create local tracks, we can use Promise.all to run them concurrently
    // [ options.uid, localTracks.audioTrack, localTracks.videoTrack ] = await Promise.all([
    //   // join the channel
    //   client.join(options.appid, options.channel, options.token || null),
    //   // create local tracks, using microphone and camera
    //   AgoraRTC.createMicrophoneAudioTrack(),
      
    //   AgoraRTC.createCameraVideoTrack(
    //     {
    //       encoderConfig: options.role == 'host' ? "480p_1" : "120p_1"
    //     }
    //     )
    // ]).catch(alert); // Error: Whoops!;
    options.type = "user";
    options.reqAction = "checkRole";
    const getUser = await getRequest(options);
    videoJoin(client, getUser.data, localTracks);
    console.log("publish success");
  }

  const startScreenCall = async() => {
    screenClient = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
    options.screenid = await screenClient.join(options.appid, options.channel, options.token || null);
    localScreenTracks.videoTrack = await AgoraRTC.createScreenVideoTrack();
    options.type = "screen";
    const getScreen = await getRequest(options);
    screenJoin(screenClient, getScreen.data, localScreenTracks);
    //await screenClient.publish(screenTrack);
  
    //return screenClient;
  }


  async function subscribe(user, mediaType) {
     // alert(mediaType)
    const uid = user.uid;
    // subscribe to a remote user
    await client.subscribe(user);
    const dataToSend = {
      uid,
      reqAction: "checkRole"
    }
    const getScreen = await getRequest(dataToSend);
    const userData = getScreen.data;
      if(userData.role == 'host'){
        if(userData.type == "user"){
          if(options.uid != userData.uid){
            
            if(mediaType == 'audio'){
              //alert('inside audio');
              user.audioTrack.play();
              $(".me").show();
              $("#me").html((userData.name.substring(0, 2)).toUpperCase());
            }else{
              $(".me").hide();
              $("#local_stream").html("");
              $("#hostName").html(userData.name);
              $("#local_stream").html("<div class='centerAlign' id='remote_video_"+uid+"'></div>");
              user.videoTrack.play("remote_video_" + uid);
              user.audioTrack.play();
            }
            $(".videoLoader").remove();
          }
        }else{
          
          if(options.userId != userData._id){
            // alert(options.userId+ " -  " + userData._id)
            $("#local_stream").hide();
            $(".me").hide();
            $("#local_stream_screen").show();
            $("#local_stream_screen").html("");
            $("#local_stream_screen").html("<div class='centerAlignScreen' id='remote_video_screen_"+userData.screenid+"'></div>");
            user.videoTrack.play("remote_video_screen_"+userData.screenid);            
          }
        }
      }else{
      let student_stream = $(`<div
        class="suggestedVideoBox animate__animated animate__slideInLeft"
        style="--animationDelay: 0.75s;" id="player-wrapper${userData.uid}">
        <div class="thumbnail">
          <div class="videoLoader" id="video-loader${userData.uid}"></div>
          <div class="videoNotFound" id="video-not-found${userData.uid}" style="display: none;">
              <span class="small" id="videoNotFound${userData.uid}">JD</span>
          </div>
          <div class="instructorName" id="only-name${userData.uid}">
              ${userData.name}
          </div>
          <div style="height: 120px;" id="remote_video_${userData.uid}"></div>
        </div>
        </div>`
        )
        $("#remote-playerlist").append(student_stream);
        const audio = new Audio("audio/piece-of-cake.mp3");
        audio.play();
        //$("<div class='remoteName' id='player-wrapper-"+uid+"'>"+userData.name+"</div><div class='player-remote' id= 'remote_video_"+uid+"'></div>").appendTo("#remote-playerlist");
        user.videoTrack.play("remote_video_" + uid);
        user.audioTrack.play();
        $("#video-loader"+uid).remove();
      }
    console.log("subscribe success");
  }
  
  function handleUserPublished(user, mediaType) {
    const id = user.uid;
    remoteUsers[id] = user;
    subscribe(user, mediaType);
  }
  
  async function handleUserUnpublished(user, mediaType) {
    // alert(user.uid+ " " +mediaType);

    const id = user.uid;
    let uidData = { 
      uid: id,
      reqAction: "unpublised"
     }
    delete remoteUsers[id];
    const getUser = await getRequest(uidData);
    // alert('getUser.data.type'+getUser.data.type)
    if(getUser.data.type == 'user'){
      if(options.userId != getUser.data._id){
        // if(getUser.data.reqAction == "onlyAudio"){
        //   $(".me").show();
        //   $("#me").html((getUser.data.name.substring(0, 2)).toUpperCase());
        // }else{
          $("#local_stream").show();
          $("#local_stream_screen").html("");
          $("#local_stream_screen").hide();
       // }
      }
    }

    $(`#player-wrapper${id}`).remove();
    $(`#me_${id}`).remove();
    $(`#remote_video_${id}`).remove();
    //$("#local_stream").show();
    //$("#local_stream_screen").html("");
    //$("#local_stream_screen").hide();
  }

  async function leave() {
    for (trackName in localTracks) {
      var track = localTracks[trackName];
      if(track) {
        track.stop();
        track.close();
        localTracks[trackName] = undefined;
      }
    }

    for (trackName in localScreenTracks) {
      var track = localTracks[trackName];
      if(track) {
        track.stop();
        track.close();
        localTracks[trackName] = undefined;
      }
    }
  
    // remove remote users and player views
    remoteUsers = {};
    $("#remote-playerlist").html("");
    // leave the channel
    await client.leave();
    // $("#local-player-name").text("");
    // $("#join").show();
    // $("#leave").hide();
    console.log("client leaves channel success");
    location.href = "https://smartnav.github.io/videoclass/videoModule/index.html?action=leave";
  }

  const buttonFun = async(type) => {
      switch (type) {
        case "cameraOff":
          
          if(options.role == "host"){
            localTracks.videoTrack.stop("remote_video_"+options.uid);
            await client.unpublish(Object.values(localTracks));
            await client.publish(localTracks.audioTrack);
            $(".me").show();
            $("#me").html((options.name.substring(0, 2)).toUpperCase());
            $("#cameraOn").hide();
            $("#cameraOff").show();
            localStatus.camera = false;
            localStatus.screenShare = false;
            localStatus.audio = true;
          }else{
            // $("#video-not-found"+options.uid).show();
            // $("#videoNotFound"+options.uid).html((options.name.substring(0, 2)).toUpperCase());
            alert("Sorry, you don't have permission to disable video.")
          }
          
          
          // const copyLocalTracks = Object.assign({}, localTracks);
          // copyLocalTracks.videoTrack = null;
          // await client.publish(Object.values(copyLocalTracks));
          break;
        case "cameraOn":
          // $("#local_stream").html("");
          // $("#local_stream").html("<div class='centerAlign' id='remote_video_"+options.uid+"'></div>");
          $("#local_stream").show();
            $("#local_stream_screen").hide();
          await client.unpublish(localTracks.audioTrack);
          localTracks.videoTrack.play("remote_video_"+options.uid);
          await client.publish(Object.values(localTracks));
          $(".me").hide();
          $("#cameraOff").hide();
          $("#cameraOn").show();
          localStatus.camera = true;
          localStatus.screenShare = false;
          localStatus.audio = true;
          break;
        case "micOff":
          localTracks.audioTrack.setVolume(0);
          $("#micOn").hide();
          $("#micOff").show();
          break;
        case "micOn":
          localTracks.audioTrack.setVolume(100);
          $("#micOn").show();
          $("#micOff").hide();
          break;
        case "shareScreenOn":
          if(options.role == "host"){
          $("#shareScreenOff").show();
          $("#shareScreenOn").hide();
          startScreenCall();
          }else{
            alert("Sorry, you don't have permission to share your screen.")
          }
          break;
        case "shareScreenOff":
          localScreenTracks.videoTrack.stop();
          localScreenTracks.videoTrack.close();
          localScreenTracks.videoTrack = null;
          options.type = "user";
          // options.currentStatus = "onlyAudio";
          options.reqAction = "leaveScreenShare";
          const getUser = await getRequest(options);
          await screenClient.leave();
          // localStatus.camera = false;
          localStatus.screenShare = false;
          localStatus.audio = true;
          if(localStatus.camera){
            $("#local_stream").show();
            $("#local_stream_screen").hide();
            $("#shareScreenOn").show();
            $("#shareScreenOff").hide();
            localTracks.videoTrack.play("remote_video_"+options.uid);
          }else{
            $(".me").show();
            $("#shareScreenOn").show();
            $("#shareScreenOff").hide();
            //$("#me").html((userData.name.substring(0, 2)).toUpperCase());
            //await client.publish(localTracks.audioTrack);
          }
          
          break;
        case "leave":
          leave();
          break;
        default:
          break;
      }
  }