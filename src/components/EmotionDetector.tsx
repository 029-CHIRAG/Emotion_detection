import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";

const EmotionDetector = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState("Detecting...");
  const classNames = [
    "Angry",
    "Disgusted",
    "Fear",
    "Happy",
    "Sad",
    "Surprise",
    "Neutral",
  ];

  const modelRef = useRef(null);
  const faceModelRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      modelRef.current = await tf.loadLayersModel(
        "https://raw.githubusercontent.com/clementreiffers/emotion-recognition-website/main/resnet50js_ferplus/model.json"
      );
      faceModelRef.current = await blazeface.load();
      console.log("Models loaded");
      detect();
    };
    loadModels();
  }, []);

  const detect = async () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4 &&
      modelRef.current &&
      faceModelRef.current
    ) {
      const video = webcamRef.current.video;
      const faceModel = faceModelRef.current;
      const emotionModel = modelRef.current;

      const returnTensors = false;
      const predictions = await faceModel.estimateFaces(video, returnTensors);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length > 0) {
        for (let i = 0; i < predictions.length; i++) {
          const start = predictions[i].topLeft;
          const end = predictions[i].bottomRight;
          const [x1, y1] = start;
          const [x2, y2] = end;
          const width = x2 - x1;
          const height = y2 - y1;

          ctx.beginPath();
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.rect(x1, y1, width, height);
          ctx.stroke();

          // Crop the face region from video
          const faceTensor = tf.browser
            .fromPixels(video)
            .slice(
              [Math.floor(y1), Math.floor(x1), 0],
              [Math.floor(height), Math.floor(width), 3]
            )
            .resizeNearestNeighbor([80, 80])
            .expandDims(0)
            .toFloat()
            .div(255.0);

          const prediction = await emotionModel.predict(faceTensor).data();
          const maxIndex = prediction.indexOf(Math.max(...prediction));
          const emotionPredicted = classNames[maxIndex];
          setEmotion(emotionPredicted);

          // Draw label
          ctx.fillStyle = "red";
          ctx.font = "18px Arial";
          ctx.fillText(emotionPredicted, x1, y1 - 10);

          tf.dispose(faceTensor);
        }
      }
    }

    requestAnimationFrame(detect);
  };

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <h2>Real-time Emotion Detection</h2>
      <Webcam
        ref={webcamRef}
        style={{ position: "absolute", width: 640, height: 480 }}
        videoConstraints={{ facingMode: "user" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", width: 640, height: 480 }}
      />
      <div style={{ marginTop: 500 }}>
        <h3>Detected Emotion: {emotion}</h3>
      </div>
    </div>
  );
};

export default EmotionDetector;
