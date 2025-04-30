import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebcam } from './useWebcam';
import { useHandPoseDetection } from './useHandPoseDetection';
import { classifyHandPose } from '../utils/handGestureClassifier';
import { GestureId } from './useGestureControl';

interface UseHandGestureDetectionProps {
  isActive: boolean;
  onGestureDetected: (gesture: GestureId) => void;
}

interface UseHandGestureDetectionReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isLoading: boolean;
  error: string | null;
}

export function useHandGestureDetection(
  { isActive, onGestureDetected }: UseHandGestureDetectionProps
): UseHandGestureDetectionReturn {
  const { videoRef, isWebcamReady, error: webcamError } = useWebcam(isActive);
  const { detector, isModelLoading, modelError } = useHandPoseDetection(isActive);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameRateLimiterRef = useRef<number>(0);

  // Combine errors from webcam and model
  useEffect(() => {
    if (webcamError) {
      setError(webcamError);
    } else if (modelError) {
      setError(modelError);
    } else {
      setError(null);
    }
  }, [webcamError, modelError]);

  const detectFrame = useCallback(async (time: number) => {
    // Limit to ~15 fps to save processing power
    if (time - lastTimeRef.current < 66) {
      requestRef.current = requestAnimationFrame(detectFrame);
      return;
    }
    
    if (!isActive || !detector || !videoRef.current || !isWebcamReady) {
      requestRef.current = requestAnimationFrame(detectFrame);
      return;
    }
    
    try {
      // Only run every few frames to reduce CPU usage
      if (frameRateLimiterRef.current % 2 === 0) {
        const hands = await detector.estimateHands(videoRef.current);
        const gesture = classifyHandPose(hands);
        onGestureDetected(gesture);
      }
      
      frameRateLimiterRef.current = (frameRateLimiterRef.current + 1) % 10;
      lastTimeRef.current = time;
    } catch (err) {
      console.error('Error in hand detection:', err);
    }
    
    // Continue the detection loop
    requestRef.current = requestAnimationFrame(detectFrame);
  }, [detector, isActive, isWebcamReady, onGestureDetected, videoRef]);

  // Start and stop the animation frame loop
  useEffect(() => {
    if (isActive && isWebcamReady && detector) {
      requestRef.current = requestAnimationFrame(detectFrame);
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isActive, isWebcamReady, detector, detectFrame]);

  return {
    videoRef,
    isLoading: isModelLoading || !isWebcamReady,
    error
  };
}