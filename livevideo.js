var client; // Agora client
var clientScreen;
var localTracks = {
  videoTrack: null,
  audioTrack: null
};

var localScreenTracks = {
  videoTrack: null,
  audioTrack: null
};
var remoteUsers = {};
// Agora client options
var options = {
  appid: null,
  channel: null,
  uid: null,
  token: null
};


const socket = io('http://54.187.176.86:4000');

$("#cameraOn").hide();
$("#micOn").hide();
$("#screenShareOff").hide();
$("#screenShareOn").hide();
$("#leave").hide();
$("#local_stream_screen").hide();
// the demo can auto join channel with params in url
$(() => {
  var urlParams = new URL(location.href).searchParams;
  options.appid = urlParams.get("appid");
  options.channel = urlParams.get("channel");
  options.token = urlParams.get("token");
  options.role =  urlParams.get("role");
  options.name =  urlParams.get("name")
  if (options.appid && options.channel) {
    $("#appid").val(options.appid);
    $("#token").val(options.token);
    $("#channel").val(options.channel);
    //$("#join-form").submit();
  }
  if(options.role == "host"){
    $("#screenShareOn").show();
  }
})

// $("#join").on("click", function (e) {
$("#join").click(async function (e) {
  e.preventDefault();
  $("#join").attr("disabled", true);
  $("#leave").show();
  $("#join").hide();
  try {
    // options.appid = $("#appid").val();
    // options.token = $("#token").val();
    // options.channel = $("#channel").val();
    options.appid = "141d75a8f7d24d5cb92d9d6ff6a41aa7";
    options.channel = "navishk";
    options.token = "006141d75a8f7d24d5cb92d9d6ff6a41aa7IADO6xXmYJjaGVJ+QXJo9HCgOITaAmUVJ55198DhzvnB0qkWApQAAAAAEABFw28kPrPjXgEAAQA/s+Ne";
    await join();
    if(options.token) {
      $("#success-alert-with-token").css("display", "block");
    } else {
      $("#success-alert a").attr("href", `index.html?appid=${options.appid}&channel=${options.channel}&token=${options.token}`);
      $("#success-alert").css("display", "block");
    }
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
  }
})

$("#screenShareOn").click(async function (e) {
  e.preventDefault();
  $("#screenShareOff").show();
  $("#screenShareOn").hide();
  try {
    await joinScreen();
    if(options.token) {
      $("#success-alert-with-token").css("display", "block");
    } else {
      $("#success-alert a").attr("href", `index.html?appid=${options.appid}&channel=${options.channel}&token=${options.token}`);
      $("#success-alert").css("display", "block");
    }
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
  }
})

$("#screenShareOff").click(function (e) {
  leaveScreenShare();
})


$("#leave").click(function (e) {
  leave();
})

async function join() {
  // create Agora client
  client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
  // add event listener to play remote tracks when remote user publishs.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  // join a channel and create local tracks, we can use Promise.all to run them concurrently
  [ options.uid, localTracks.audioTrack, localTracks.videoTrack ] = await Promise.all([
    // join the channel
    client.join(options.appid, options.channel, options.token || null),
    // create local tracks, using microphone and camera
    AgoraRTC.createMicrophoneAudioTrack(),
    AgoraRTC.createCameraVideoTrack()
  ]);
  options.type = "user";
  socket.emit('checkRole', options);
  // play local video track

  socket.on('roleRec', async function(userData){
    options.userId = userData._id;
    // alert(userData.role+userData.uid)
    if(userData.role == 'host'){
      $("#local_stream").html("");
      localTracks.videoTrack.play("local_stream");
      $("<div class='content'><h1>"+userData.name+" ("+userData.role+")</h1><p>User id = "+userData.uid+"</p></div>").appendTo("#local_stream");
    }else{
      $("<div class='remoteName'>"+userData.name+"</div><div class='player-remote' id= 'me'></div>").appendTo("#remote-playerlist");
      localTracks.videoTrack.play("me");
    }
    try {
      await client.publish(Object.values(localTracks));
    } catch (error) {
      alert(error)
    }
    
    // alert("publish success");
  })

  
  // $("#local-player-name").text(`localVideo(${options.uid})`);

  // publish local tracks to channel
 
  console.log("publish success");
}


async function joinScreen() {
  localTracks.videoTrack.stop("local_stream");
  // create Agora client
  clientScreen = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
  // add event listener to play remote tracks when remote user publishs.
  //client.on("user-published", handleUserPublished);
  //client.on("user-unpublished", handleUserUnpublished);
  // join a channel and create local tracks, we can use Promise.all to run them concurrently
  [ options.uid, localScreenTracks.audioTrack, localScreenTracks.videoTrack ] = await Promise.all([
    // join the channel
    clientScreen.join(options.appid, options.channel, options.token || null),
    // create local tracks, using microphone and camera
    AgoraRTC.createMicrophoneAudioTrack(),
    AgoraRTC.createScreenVideoTrack()
  ]);

  $("#local_stream").html("");
  // alert("here");
  // localTracks.screenTrack.play("local_stream");
  options.type = "screen";
  // alert(options);
  socket.emit('checkRole', options);
  // play local video track

 socket.on('roleRecScreen', function(userData){
  //  alert(userData)
    options.userId = userData._id;
    if(userData.role == 'host'){
      $("#local_stream").html("");
      localScreenTracks.videoTrack.play("local_stream");
      $("<div class='content'><h1>"+userData.name+" ("+userData.role+")</h1><p>User id = "+userData.uid+"</p></div>").appendTo("#local_stream");
    }else{
      alert("You are not authorized to share your screen.")
    }
  })

  
  // $("#local-player-name").text(`localVideo(${options.uid})`);

  // publish local tracks to channel
  await clientScreen.publish(Object.values(localScreenTracks));
  console.log("publish success");
}

async function leaveScreenShare() {
  localScreenTracks.videoTrack.stop();
  localScreenTracks.videoTrack.close();
  options.type = "user";
  socket.emit('leaveScreenShare', options);
  //localTracks.videoTrack.play("local_stream");
  // client.on("user-published", handleUserPublished);
  // remove remote users and player views
  await clientScreen.leave();
  $("#screenShareOn").show();
  $("#screenShareOff").hide();
  
  console.log("client leaves channel success");
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

  // remove remote users and player views
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();

  $("#local-player-name").text("");
  $("#join").show();
  $("#leave").hide();
  console.log("client leaves channel success");
}

async function subscribe(user, mediaType) {
  
  const uid = user.uid;
  
  // subscribe to a remote user
  await client.subscribe(user);
  const dataToSend = {
    uid
  }
  
  socket.emit('checkRole', dataToSend);
  socket.on('roleRecAck', function(userData){
    if(userData.role == 'host'){
      if(userData.type == "user"){
        if(options.userId != userData._id){
          
          $("#local_stream").show();
          $("#local_stream_screen").hide();
          $("#local_stream").html("<div class='hund' id= 'remote_video_"+uid+"'></div><div class='content'><h1>"+userData.name+" ("+userData.role+")</h1><p>User Id = "+userData.uid+"</p></div>");
          user.videoTrack.play("remote_video_" + uid);
        }
      }else{
        if(options.userId != userData._id){
          // alert(options.userId +" " +userData._id);
          $("#local_stream").hide();
          $("#local_stream_screen").show();
          $("#local_stream_screen").html("<div class='hund' id= 'remote_video_"+uid+"'></div><div class='content'><h1>"+userData.name+" ("+userData.role+")</h1><p>User Id = "+uid+"</p></div>");
          user.videoTrack.play("remote_video_" + uid);
        }
      }
      // $("<div class='hund' id= 'remote_video_"+id+"'></div>").appendTo("#local_stream");
    }else{
      $("<div class='remoteName'>"+userData.name+"</div><div class='player-remote' id= 'remote_video_"+uid+"'></div>").appendTo("#remote-playerlist");
      user.videoTrack.play("remote_video_" + uid);
    }
  })
  console.log("subscribe success");
  // if (mediaType !== 'audio') {
  //   const player = $(`
  //     <div id="player-wrapper-${uid}">
  //       <p class="player-name">remoteUser(${uid})</p>
  //       <div id="player-${uid}" class="player"></div>
  //     </div>
  //   `);
  //   $("#remote-playerlist").append(player);
  //   user.videoTrack.play(`player-${uid}`);
  // }
  // if (mediaType !== 'video') {
  //   user.audioTrack.play();
  // }
}

function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
  const id = user.uid;
  let uidData = { uid: id }
  socket.emit("unpublised", uidData);
  // if(id != options.uid){
    
    
    
  // }
  
  delete remoteUsers[id];
  $(`#player-wrapper-${id}`).remove();
}

socket.on("unpublisedAck", (data)=> {
  // alert("unpublished");
    $("#local_stream").show();
    $("#local_stream_screen").hide();
})