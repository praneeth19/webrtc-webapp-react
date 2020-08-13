import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

import './App.css';

function App() {
  const constraints = {
    video: true,
    audio: true,
  };
  const pc_config = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  };
  let localVideoRef = useRef();
  let remoteVideoRef = useRef();
  let pc = useRef();
  let textref = useRef();
  let socket = useRef();
  // let candidates = useRef([]);
  const [candidates, setCandidates] = useState([]);
  // navigator.getUserMedia =
  //   navigator.getUserMedia ||
  //   navigator.webkitGetUserMedia ||
  //   navigator.mozGetUserMedia;

  const success = (stream) => {
    // window.localStream = stream;
    localVideoRef.current.srcObject = stream;
    pc.current.addStream(stream);
  };

  const failure = (e) => {
    console.log('getUserMedia Error', e);
  };

  const createOffer = () => {
    console.log('Offer');
    pc.current.createOffer({ offerToReceiveVideo: 1 }).then(
      (sdp) => {
        console.log(JSON.stringify(sdp));
        pc.current.setLocalDescription(sdp);
        sendToPeer('offerOrAnswer', sdp);
      },
      (e) => {}
    );
  };

  const setRemoteDescription = () => {
    const desc = JSON.parse(textref.current.value);
    console.log('textref.current,desc', textref.current, desc);
    pc.current.setRemoteDescription(new RTCSessionDescription(desc));
  };

  const createAnswer = () => {
    console.log('Answer');
    pc.current.createAnswer({ offerToReceiveVideo: 1 }).then(
      (sdp) => {
        console.log(JSON.stringify(sdp));
        pc.current.setLocalDescription(sdp);
        sendToPeer('offerOrAnswer', sdp);
      },
      (e) => {}
    );
  };

  const addCandidate = () => {
    // const candidate = JSON.parse(textref.current.value);
    // console.log('Adding candidate:', candidate);
    // pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('candidates', candidates);
    candidates.map((candidate) => {
      console.log(candidate);
      pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  // Socket send request helper
  const sendToPeer = (messageType, payload) => {
    socket.current.emit(messageType, { socketID: socket.current.id, payload });
  };

  useEffect(() => {
    socket.current = io('/webrtcPeer', {
      path: '/webrtc-webapp-react',
      query: {},
    });

    // socket.current = io('https://4a64fb821abd.ngrok.io/webrtcPeer', {
    //       query: {},
    //     });
    socket.current.on('connection-success', (success) => {
      console.log(success);
    });

    socket.current.on('offerOrAnswer', (sdp) => {
      console.log('offerOrAnswer from server');
      textref.current.value =
        'YOU HAVE A INCOMING CALL, PLEASE CLICK ON ANSWER';
      pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.current.on('candidate', (candidate) => {
      console.log('new candidate from server', candidate);

      pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    console.log('navigator', navigator);
    console.log('navigator.mediaDevices', navigator.mediaDevices);
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(success)
      .catch(failure);

    pc.current = new RTCPeerConnection(pc_config);

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('in onicecandidate', e.candidate);
        // console.log(JSON.stringify(e.candidate));
        sendToPeer('candidate', e.candidate);
      }
    };

    pc.current.oniceconnectionstatechange = (e) => {
      console.log('in oniceconnectionstatechange');
      console.log(e);
    };

    pc.current.onaddstream = (e) => {
      console.log('in onaddstream');
      remoteVideoRef.current.srcObject = e.stream;
    };

    pc.current.ontrack = (e) => {
      console.log('in ontrack to add stream');
      remoteVideoRef.current.srcObject = e.streams[0];
    };
    return () => {};
  }, []);

  return (
    <div>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: 'black',
        }}
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
      ></video>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: 'black',
        }}
        ref={remoteVideoRef}
        autoPlay
        playsInline
      ></video>
      <br></br>
      <button onClick={createOffer}>Offer</button>
      <button onClick={createAnswer}>Answer</button>
      <br></br>
      <textarea ref={textref}></textarea>
      <br></br>
      {/* <button onClick={setRemoteDescription}>Set Remote Desc</button>
      <button onClick={addCandidate}>Add Candidate </button> */}
    </div>
  );
}

export default App;
