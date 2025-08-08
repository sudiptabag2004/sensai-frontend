"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useSession } from "next-auth/react";
// Save plagiarism event to backend
async function savePlagiarismEvent(
  email: string,
  code: string,
  event_type: string
) {
  await fetch("http://localhost:8001/api/plagiarism-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      timestamp: new Date().toISOString(),
      code,
      event_type,
    }),
  });
}

interface Violation {
  id: number;
  message: string;
  timestamp: Date;
}

interface Position {
  x: number;
  y: number;
}

const loadModels = async (path: string = "/models"): Promise<void> => {
  await faceapi.nets.tinyFaceDetector.loadFromUri(path);
  await faceapi.nets.faceLandmark68Net.loadFromUri(path);
  await faceapi.nets.faceRecognitionNet.loadFromUri(path);
  await faceapi.nets.ssdMobilenetv1.loadFromUri(path);
};

const isSameFace = (
  desc1: Float32Array,
  desc2: Float32Array,
  threshold: number = 0.55
): boolean => {
  const distance = faceapi.euclideanDistance(desc1, desc2);
  return distance < threshold;
};

const FaceMonitor: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [referenceDescriptor, setReferenceDescriptor] =
    useState<Float32Array | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [showViolations, setShowViolations] = useState<boolean>(false);

  // Draggable state
  const monitorRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position>({ x: 20, y: 20 });
  const [dragging, setDragging] = useState<boolean>(false);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  const { data: session } = useSession();

  // Load models + start video
  useEffect(() => {
    const init = async (): Promise<void> => {
      await loadModels();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setReady(true);
          };
        }
      } catch (err) {
        console.error("Failed to access webcam:", err);
      }
    };
    init();
  }, []);

  const handleCaptureReference = async (): Promise<void> => {
    if (!videoRef.current) return;

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert("No face detected. Please try again.");
      return;
    }

    setReferenceDescriptor(detection.descriptor);
    alert("Reference face captured!");
  };

  // Monitor violations
  useEffect(() => {
    if (!referenceDescriptor || !videoRef.current) return;
    const userEmail = session?.user?.email || "";
    const code = "N/A"; // TODO: Replace with actual code if available

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const violationId = Date.now();
      const timestamp = new Date();

      if (detections.length === 0) {
        setViolations((prev) => [
          { id: violationId, message: "No face detected", timestamp },
          ...prev,
        ]);
        savePlagiarismEvent(userEmail, code, "No face detected");
      } else if (detections.length > 1) {
        setViolations((prev) => [
          { id: violationId, message: "Multiple faces detected", timestamp },
          ...prev,
        ]);
        savePlagiarismEvent(userEmail, code, "Multiple faces detected");
      } else {
        const currentDescriptor = detections[0].descriptor;
        if (!isSameFace(currentDescriptor, referenceDescriptor)) {
          setViolations((prev) => [
            { id: violationId, message: "Different face detected", timestamp },
            ...prev,
          ]);
          savePlagiarismEvent(userEmail, code, "Different face detected");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [referenceDescriptor, session]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    setDragging(true);
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (dragging) {
      setPos({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const handleMouseUp = (): void => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, offset]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getViolationColor = (message: string): string => {
    if (message.includes("Multiple faces")) return "text-orange-400";
    if (message.includes("Different face")) return "text-red-400";
    return "text-yellow-400";
  };

  const getViolationIcon = (message: string): string => {
    if (message.includes("Multiple faces")) return "👥";
    if (message.includes("Different face")) return "❌";
    return "⚠️";
  };

  return (
    <div
      ref={monitorRef}
      className="fixed w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[9999] backdrop-blur-sm"
      style={{
        top: pos.y,
        left: pos.x,
        cursor: dragging ? "grabbing" : "grab",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-medium rounded-t-xl select-none flex justify-between items-center border-b border-gray-600"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Proctoring Monitor</span>
        </div>

        <div
          className="relative flex items-center gap-2"
          onMouseEnter={() => setShowViolations(true)}
          onMouseLeave={() => setShowViolations(false)}
        >
          <div className="flex items-center gap-1">
            {violations.length > 0 && (
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            )}
            <span
              className={`text-xs font-mono px-2 py-1 rounded-full ${
                violations.length === 0
                  ? "bg-green-900 text-green-300"
                  : "bg-red-900 text-red-300"
              }`}
            >
              {violations.length}
            </span>
          </div>

          {/* Violations Tooltip */}
          {showViolations && violations.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10 p-3">
              <div className="text-xs text-gray-300 font-medium mb-2">
                Recent Violations
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="text-lg leading-none">
                      {getViolationIcon(violation.message)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium ${getViolationColor(
                          violation.message
                        )}`}
                      >
                        {violation.message}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {formatTime(violation.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Video Feed */}
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 bg-gray-800 rounded-lg object-cover border border-gray-700"
          />
          <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-60 rounded text-xs text-white">
            LIVE
          </div>
        </div>

        {/* Capture Button */}
        {!referenceDescriptor && ready && (
          <button
            onClick={handleCaptureReference}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            📸 Capture Reference Face
          </button>
        )}

        {/* Status Indicators */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                ready ? "bg-green-400" : "bg-yellow-400"
              }`}
            ></div>
            <span className="text-gray-400">
              {ready ? "Ready" : "Initializing..."}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                referenceDescriptor ? "bg-green-400" : "bg-gray-600"
              }`}
            ></div>
            <span className="text-gray-400">
              {referenceDescriptor ? "Reference Set" : "No Reference"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceMonitor;
