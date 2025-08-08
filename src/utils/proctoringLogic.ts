import * as faceapi from 'face-api.js';

type ProctoringResult = {
  violation: boolean;
  reason: string | null;
};

let referenceDescriptor: Float32Array | null = null;

/**
 * Load face detection and recognition models
 */
export async function loadModels(path = '/models') {
  await faceapi.nets.tinyFaceDetector.loadFromUri(path);
  await faceapi.nets.faceRecognitionNet.loadFromUri(path);
  await faceapi.nets.faceLandmark68Net.loadFromUri(path);
}

/**
 * Set the reference face descriptor (identity baseline)
 */
export async function setReferenceFace(video: HTMLVideoElement): Promise<boolean> {
  const detections = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detections) {
    return false;
  }

  referenceDescriptor = detections.descriptor;
  return true;
}

/**
 * Compare current face with reference and apply proctoring rules
 */
export async function checkProctoring(video: HTMLVideoElement): Promise<ProctoringResult> {
  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!detections.length) {
    return { violation: true, reason: 'No face detected' };
  }

  if (detections.length > 1) {
    return { violation: true, reason: 'Multiple faces detected' };
  }

  if (referenceDescriptor) {
    const distance = faceapi.euclideanDistance(detections[0].descriptor, referenceDescriptor);
    const threshold = 0.6; // recommended: 0.5–0.6

    if (distance > threshold) {
      return { violation: true, reason: 'Different face detected' };
    }
  }

  return { violation: false, reason: null };
}
