import { Hand, Keypoint } from '@tensorflow-models/hand-pose-detection';
import { GestureId } from '../hooks/useGestureControl';

// Constants for gesture classification
const ANGLE_THRESHOLD_THUMBS_UP = 120;
const ANGLE_THRESHOLD_THUMBS_DOWN = 120;
const ANGLE_THRESHOLD_THUMBS_SIDEWAYS = 30;

// Helper to calculate angle between three points in 3D space
function calculateAngle(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  c: { x: number; y: number; z: number }
): number {
  const vectorAB = {
    x: b.x - a.x,
    y: b.y - a.y,
    z: b.z - a.z,
  };

  const vectorBC = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: c.z - b.z,
  };

  const dotProduct =
    vectorAB.x * vectorBC.x + vectorAB.y * vectorBC.y + vectorAB.z * vectorBC.z;

  const magnitudeAB = Math.sqrt(
    vectorAB.x ** 2 + vectorAB.y ** 2 + vectorAB.z ** 2
  );
  const magnitudeBC = Math.sqrt(
    vectorBC.x ** 2 + vectorBC.y ** 2 + vectorBC.z ** 2
  );

  const angleRadians = Math.acos(dotProduct / (magnitudeAB * magnitudeBC));
  return (angleRadians * 180) / Math.PI;
}

export function classifyHandPose(hands: Hand[]): GestureId {
  if (!hands || hands.length === 0) return null;

  const hand = hands[0];
  const keypoints = hand.keypoints3D;

  if (!keypoints || keypoints.length < 21) return null;

  const thumbCMC = keypoints[1];
  const thumbMCP = keypoints[2];
  const thumbIP = keypoints[3];
  const thumbTIP = keypoints[4];
  const wrist = keypoints[0];
  const indexMCP = keypoints[5];
  const pinkyMCP = keypoints[17];

  // Check for missing z-values
  const points = [thumbCMC, thumbMCP, thumbIP, thumbTIP, wrist, indexMCP, pinkyMCP];
  if (points.some(p => p.z === undefined)) {
    return null;
  }

  // Safe cast with z guaranteed
  const thumbBendAngle = calculateAngle(
    thumbCMC as { x: number; y: number; z: number },
    thumbMCP as { x: number; y: number; z: number },
    thumbTIP as { x: number; y: number; z: number }
  );

  const isThumbExtended = thumbBendAngle > 150;
  if (!isThumbExtended) return null;

  const thumbDirection = {
    x: thumbTIP.x - wrist.x,
    y: thumbTIP.y - wrist.y,
    z: (thumbTIP.z as number) - (wrist.z as number),
  };

  const palmCenter = {
    x: (indexMCP.x + pinkyMCP.x) / 2,
    y: (indexMCP.y + pinkyMCP.y) / 2,
    z: ((indexMCP.z as number) + (pinkyMCP.z as number)) / 2,
  };

  const palmDirection = {
    x: palmCenter.x - wrist.x,
    y: palmCenter.y - wrist.y,
    z: palmCenter.z - (wrist.z as number),
  };

  const normalizeVector = (v: { x: number; y: number; z: number }) => {
    const mag = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
  };

  const normThumbDir = normalizeVector(thumbDirection);
  const normPalmDir = normalizeVector(palmDirection);
  const dotProduct = normThumbDir.y * normPalmDir.y;

  if (dotProduct < -0.7) return 'THUMBS_UP';
  if (dotProduct > 0.7) return 'THUMBS_DOWN';
  if (Math.abs(dotProduct) < 0.3) return 'THUMBS_SIDEWAYS';

  return null;
}
