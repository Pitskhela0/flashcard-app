import React, { useEffect, useRef, useState } from "react";
import { GestureId } from "../hooks/useGestureControl";
import * as tf from "@tensorflow/tfjs";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";

/**
 * Component that accesses the user's webcam and runs TensorFlow.js hand pose detection
 * to identify thumbs up, down, or sideways gestures.
 * 
 * This component:
 * 1. Requests camera access when active
 * 2. Loads the TensorFlow.js MediaPipe Hands model
 * 3. Runs continuous detection on video frames
 * 4. Classifies detected hand poses into gesture types
 * 5. Calls the provided callback when gestures are detected
 * 6. Properly manages resources (camera, TensorFlow model, animation frames)
 * 
 * @param props.isActive - Whether the detector should be actively capturing and processing
 * @param props.onGestureDetected - Callback function when a gesture is detected
 */
export default function WebcamGestureDetector({
  isActive,
  onGestureDetected,
}: {
  isActive: boolean;
  onGestureDetected: (gesture: GestureId) => void;
}) {
  // Reference to the video element
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State for handling errors and loading status
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  
  // Reference to the media stream to properly clean up
  const streamRef = useRef<MediaStream | null>(null);
  
  // Reference to the hand pose detector model
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  
  // Reference to store the animation frame ID for cleanup
  const requestAnimationIdRef = useRef<number | null>(null);

  // Setup the webcam when the component mounts
  useEffect(() => {
    // Don't attempt to access the camera if detection is not active
    if (!isActive) {
      return;
    }

    setIsLoading(true);
    setModelLoading(true);
    setError(null);

    // Function to setup the webcam
    const setupWebcam = async () => {
      try {
        // Request camera access with specific constraints for performance
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user", // Use front-facing camera
            frameRate: { ideal: 10, max: 15 }, // Lower frameRate for better performance
          },
          audio: false, // We don't need audio
        });
        
        // Store the stream in the ref for cleanup
        streamRef.current = stream;

        // If the component unmounted during the async operation, clean up
        if (!videoRef.current) {
          stopStream();
          return;
        }

        // Attach the stream to the video element
        videoRef.current.srcObject = stream;
        
        // Play the video
        videoRef.current.play().then(() => {
          setIsLoading(false);
          
          // Now that the webcam is ready, load the hand pose detection model
          loadHandPoseModel();
        }).catch(err => {
          setError("Error initializing video: " + err.message);
          setIsLoading(false);
        });
      } catch (err) {
        // Handle errors when camera access is denied or not available
        setError("Could not access camera. Please check permissions.");
        setIsLoading(false);
      }
    };

    // Function to stop the media stream
    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    // Start the webcam setup
    setupWebcam();

    // Cleanup function to stop the stream when the component unmounts
    // or when isActive changes to false
    return () => {
      stopStream();
      // Also cancel any ongoing animation frames
      if (requestAnimationIdRef.current) {
        cancelAnimationFrame(requestAnimationIdRef.current);
        requestAnimationIdRef.current = null;
      }
    };
  }, [isActive]); // Re-run when isActive changes

  /**
   * Loads the TensorFlow.js hand pose detection model
   */
  const loadHandPoseModel = async () => {
    try {
      setModelLoading(true);
      
      // Make sure TensorFlow is ready
      await tf.ready();
      
      // Try to use WebGL if available for better performance
      const backends = Object.keys(tf.engine().registryFactory);
      if (backends.includes('webgl') && tf.getBackend() !== 'webgl') {
        await tf.setBackend('webgl');
      }
      
      // Create a hand pose detector using the MediaPipe model
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'mediapipe', // or 'tfjs'
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        modelType: 'lite', // Use 'lite' for better performance, 'full' for better accuracy
        maxHands: 1 // We only need to detect one hand for gestures
      };
      
      const detector = await handPoseDetection.createDetector(
        model, 
        detectorConfig as handPoseDetection.MediaPipeHandsMediaPipeModelConfig
      );
      
      // Store the detector in the ref
      detectorRef.current = detector;
      setModelLoading(false);
      
      // Once model is loaded, start the prediction loop
      startPredictionLoop();
      
    } catch (err) {
      setError("Failed to load hand detection model. Please try again.");
      setModelLoading(false);
    }
  };
  
  /**
   * Analyzes the hand pose landmarks and classifies the gesture
   * @param hand - The hand object returned by the hand pose detector
   * @returns The detected gesture ID or null if no recognizable gesture
   */
  const classifyHandPose = (hand: handPoseDetection.Hand): GestureId => {
    if (!hand.keypoints || hand.keypoints.length < 21) {
      return null; // Not enough keypoints detected
    }
    
    // Get relevant keypoints for thumb and other fingers
    // MediaPipe Hand uses these indices: 
    // - 4: thumb tip
    // - 8: index finger tip
    // - 12: middle finger tip
    // - 16: ring finger tip
    // - 20: pinky tip
    // - 0: wrist
    const thumbTip = hand.keypoints[4];
    const indexTip = hand.keypoints[8];
    const middleTip = hand.keypoints[12];
    const ringTip = hand.keypoints[16];
    const pinkyTip = hand.keypoints[20];
    const wrist = hand.keypoints[0];
    
    // Calculate if other fingers are extended (not curled)
    // Compare y positions (in image coordinates, lower y is higher up)
    const fingersExtended = [
      indexTip.y < middleTip.y - 20, // index extended
      middleTip.y < ringTip.y - 20,  // middle extended
      ringTip.y < pinkyTip.y - 20,   // ring extended
      // We don't check pinky separately as it's less reliable
    ];
    
    // Count extended fingers (excluding thumb)
    const extendedFingerCount = fingersExtended.filter(Boolean).length;
    
    // Check thumb direction relative to wrist
    // Note: In camera view, x increases to the right, y increases downward
    
    // Calculate thumb position relative to wrist
    const thumbYDiff = wrist.y - thumbTip.y; // Positive means thumb is above wrist
    const thumbXDiff = thumbTip.x - wrist.x; // Positive means thumb is to the right of wrist
    const horizontalDiff = Math.abs(thumbXDiff);
    
    // For THUMBS_UP: thumb is above wrist, other fingers aren't extended much
    if (thumbYDiff > 40 && extendedFingerCount < 2) {
      return "THUMBS_UP";
    }
    
    // For THUMBS_DOWN: thumb is below wrist, other fingers aren't extended much
    if (thumbYDiff < -40 && extendedFingerCount < 2) {
      return "THUMBS_DOWN";
    }
    
    // For THUMBS_SIDEWAYS: thumb is to the side of wrist, other fingers aren't extended much
    // We'll check both left and right directions
    if (horizontalDiff > 60 && extendedFingerCount < 2) {
      return "THUMBS_SIDEWAYS";
    }
    
    // If no clear gesture is detected
    return "OTHER";
  };

  /**
   * Starts the continuous loop of hand pose detection
   */
  const startPredictionLoop = () => {
    // Only start if we have both the video element and the detector
    if (!videoRef.current || !detectorRef.current || !isActive) {
      return;
    }
    
    const video = videoRef.current;
    const detector = detectorRef.current;
    
    // Function to run detection on each frame
    const detectHandPose = async () => {
      if (!videoRef.current || !detectorRef.current || !isActive) {
        return;
      }
      
      try {
        // Check if video is ready to be processed
        if (video.readyState === 4) {
          // Detect hands in the current video frame
          const hands = await detector.estimateHands(video);
          
          // If we detected at least one hand
          if (hands && hands.length > 0) {
            // Classify the hand pose
            const gesture = classifyHandPose(hands[0]);
            
            // Send the detected gesture to the parent component
            onGestureDetected(gesture);
          } else {
            // No hands detected, send null
            onGestureDetected(null);
          }
        }
      } catch (err) {
        // Just catch errors silently during detection
      }
      
      // Continue the detection loop if component is still active
      if (isActive) {
        requestAnimationIdRef.current = requestAnimationFrame(detectHandPose);
      }
    };
    
    // Start the detection loop
    detectHandPose();
  };

  return (
    <div className="webcam-container">
      {isActive && (
        <>
          {(isLoading || modelLoading) && (
            <div className="loading-indicator p-2 mb-2 text-sm text-blue-700 bg-blue-100 rounded-md">
              <p>{isLoading ? "Initializing camera..." : "Loading hand detection model..."}</p>
            </div>
          )}
          
          {error && (
            <div className="error-message p-2 mb-2 text-sm text-red-700 bg-red-100 rounded-md">
              <p>{error}</p>
            </div>
          )}
          
          {!isLoading && !modelLoading && !error && (
            <div className="detection-active p-2 mb-2 text-sm text-green-700 bg-green-100 rounded-md">
              <p>Hand detection active - show a thumbs gesture to rate the card!</p>
            </div>
          )}
          
          {/* The video element is hidden but used for processing */}
          <video 
            ref={videoRef}
            className="hidden" // Hide the video element (we don't need to show it to the user)
            width="640"
            height="480"
            muted
            playsInline
          />
        </>
      )}
    </div>
  );
}