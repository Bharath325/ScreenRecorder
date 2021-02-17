const { writeFile } = require("fs");
const { desktopCapturer, remote } = require("electron");
const videoElement = document.querySelector("video");
const videoSelectBtn = document.getElementById("videoSelectBtn");

videoSelectBtn.onclick = getVideoSources;

const { dialog, Menu } = remote;

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    })
  );
  videoOptionsMenu.popup();
}

let mediaRecorder; //An instance to save recording
const recordedChunks = [];
//Change the videoSource window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  //Creating Stream of video in window
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  //Previewing video in video element
  videoElement.srcObject = stream;
  videoElement.play();

  //Create the recorder
  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  //REgister Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}
const startBtn = document.getElementById("startBtn");
startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};
const stopBtn = document.getElementById("stopBtn");
stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};
//Capture all recorded chunks
function handleDataAvailable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
}

//Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webFrame; codecs=vp9",
  });
  const buffer = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });
  writeFile(filePath, buffer, () => console.log("Video Saved Successfully"));
}
