import { useEffect } from "react";

function App() {
  useEffect(() => {
    const video = document.getElementById("video");
    const textStatus = document.getElementById("textStatus");

    //Start video
    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(function (stream) {
          // Older browsers may not have srcObject
          if ("srcObject" in video) {
            video.srcObject = stream;
          } else {
            // Avoid using this in new browsers, as it is going away.
            video.src = window.URL.createObjectURL(stream);
          }
          video.onloadedmetadata = function (e) {
            video.play();
          };
        })
        .catch(function (err) {
          console.log(err.name + ": " + err.message);
        });
    };

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
      faceapi.nets.faceExpressionNet.loadFromUri("./models"),
    ]).then(startVideo);

    let statusIcons = {
      default: { emoji: "😐", color: "#02c19c" },
      neutral: { emoji: "😐", color: "#54adad" },
      happy: { emoji: "😀", color: "#148f77" },
      sad: { emoji: "😥", color: "#767e7e" },
      angry: { emoji: "😠", color: "#b64518" },
      fearful: { emoji: "😨", color: "#90931d" },
      disgusted: { emoji: "🤢", color: "#1a8d1a" },
      surprised: { emoji: "😲", color: "#1230ce" },
    };

    video.addEventListener("play", () => {
      //Get dimensions from the actual video source
      const displaySize = { width: video.width, height: video.height };

      //Match those dimensions
      //   faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        // canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        // faceapi.draw.drawDetections(canvas, resizedDetections)
        // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

        if (detections.length > 0) {
          //For each face detection
          detections.forEach((element) => {
            let status = "";
            let valueStatus = 0.0;
            for (const [key, value] of Object.entries(element.expressions)) {
              if (value > valueStatus) {
                status = key;
                valueStatus = value;
              }
            }
            textStatus.innerHTML = status;
          });
        } else {
          //If not face was detected
          textStatus.innerHTML = "...";
        }
      }, 100);
    });
  }, []);
  return (
    <div
      id="app"
      className="w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4"
    >
      <div className="neo-blur backdrop-blur-xl bg-white/10 font-bold text-xl text-center rounded-2xl p-6 w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transform transition-all duration-300 hover:shadow-[0_10px_40px_rgb(0,0,0,0.2)] hover:translate-y-[-5px]">
        Detected Emotion:{" "}
        <span id="textStatus" className="text-green-600 font-bold">
          ...
        </span>
        !
      </div>
      <div className="rounded-xl overflow-hidden shadow-lg border border-4 border-purple-400">
        <video

          id="video"
          width="540"
          height="540"
          muted
          autoPlay
          className="object-cover "
        ></video>
      </div>
    </div>
  );
}

export default App;
