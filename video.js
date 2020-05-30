// document.addEventListener('DOMContentLoaded', function() {
//     var elems = document.querySelectorAll('.modal');
//     var instances = M.Modal.init(elems, options);
//   });

//   // Or with jQuery

//   $(document).ready(function(){
//     $('.modal').modal();
//   });

var client; // Agora client
var localTracks = {
  videoTrack: null,
  //screenTrack: null,
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

var ival = 0;

// the demo can auto join channel with params in url
// $(() => {
//   var urlParams = new URL(location.href).searchParams;
//   options.appid = urlParams.get("appid");
//   options.channel = urlParams.get("channel");
//   options.token = urlParams.get("token");
//   if (options.appid && options.channel) {
//     $("#appid").val(options.appid);
//     $("#token").val(options.token);
//     $("#channel").val(options.channel);
    
//     //$("#join-form").submit();
//   }
//   console.log(urlParams.get("appid"), urlParams.get("channel"), urlParams.get("token"));
// })

async function myFunction(){
  $("#join").attr("disabled", true);
  var urlParams = new URL(location.href).searchParams;
  try {
    // options.appid = $("#appid").val();
    // options.token = $("#token").val();
    // options.channel = $("#channel").val();
    
    options.appid = urlParams.get("appid");
    options.channel = urlParams.get("channel");
    options.token = urlParams.get("token");
    await join();
  } catch (error) {
    //console.log("error", error);
    if(error.code){
      alert(error.code);
      return;
    }
    //console.error(error);
  } finally {
    $("#success-alert a").attr("href", `index.html?appid=${options.appid}&channel=${options.channel}&token=${options.token}`);
    $("#success-alert").css("display", "block");
    $("#leave").attr("disabled", false);
  }
}

$("#leave").click(function (e) {
  leave();
})

async function join() {
  // create Agora client
  console.log("Inside join");
  client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });

  // add event listener to play remote tracks when remote user publishs.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  options.uid = await client.join(options.appid, options.channel, options.token || null);
  console.log("options.uid", options.uid);
  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
  
  localTracks.videoTrack.play("local-player");
  $("#local-player-name").text(`localVideo(${options.uid})`);

  // publish local tracks to channel
  await client.publish(Object.values(localTracks));
  console.log("publish success");
}

async function startScreenCall() {
  const screenClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  // add event listener to play remote tracks when remote user publishs.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  await screenClient.join(options.appid, options.channel, options.token || null);
  localTracks.videoTrack.stop("local-player");
  localTracks.screenTrack = await AgoraRTC.createScreenVideoTrack();
  localTracks.screenTrack.play("local-player");
  await screenClient.publish([localTracks.screenTrack]);
  return screenClient;
}

async function stopScreenCall() {
  localTracks.videoTrack.play("local-player");
  localTracks.screenTrack.stop("local-player");
  localTracks.screenTrack.close();
  await screenClient.publish(screenTrack);
  // return screenClient;
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
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  console.log("client leaves channel success");
}

async function subscribe(user) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, "all");
  console.log("subscribe success");
  const player = $(`
    <div id="player-wrapper-${uid}">
      <p class="player-name">remoteUser(${uid})</p>
      <div id="player-${uid}" class="player-remote"></div>
    </div>
  `);

  console.log("------------------------------", player)
  $("#remote-playerlist").append(player);
  user.videoTrack.play(`player-${uid}`);
  user.audioTrack.play();
}

function handleUserPublished(user, otherone) {
  // console.log("L", JSON.stringify(otherone))
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user);
}

function handleUserUnpublished(user) {
  const id = user.uid;
  delete remoteUsers[id];
  $(`#player-wrapper-${id}`).remove();
}