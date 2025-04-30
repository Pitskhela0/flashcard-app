/**
 * WebcamGestureDetector Component
 * 
 * Specifications:
 * - Accesses and processes webcam video feed to detect hand gestures
 * - Integrates with TensorFlow.js and MediaPipe Hands model for hand pose detection
 * - Classifies detected hand poses into predefined gestures (thumbs up, down, sideways)
 * - Efficiently manages system resources by:
 *   - Only processing video when component is active
 *   - Using appropriate frame rates for performance
 *   - Properly cleaning up media streams and TensorFlow resources
 * - Provides real-time feedback about detection status and errors
 * - Implements privacy-focused design that processes all video locally
 * - Handles browser compatibility and permission issues gracefully
 */
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
  /**
   * Video Element Reference
   * 
   * Specifications:
   * - Provides access to the video element in the DOM
   * - Used to attach media stream and as input for hand detection
   * - Hidden from user view as we don't need to display the webcam feed
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  
  /**
   * State Management
   * 
   * Specifications:
   * - error: Stores error messages when camera or model initialization fails
   * - isLoading: Tracks webcam initialization status
   * - modelLoading: Tracks TensorFlow model loading status
   */
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  
  /**
   * Media Stream Reference
   * 
   * Specifications:
   * - Maintains reference to active media stream for proper cleanup
   * - Prevents memory leaks by allowing stream tracks to be stopped
   */
  const streamRef = useRef<MediaStream | null>(null);
  
  /**
   * Hand Pose Detector Reference
   * 
   * Specifications:
   * - Stores reference to the TensorFlow.js hand pose detector model
   * - Maintained in a ref to avoid recreating the model unnecessarily
   */
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  
  /**
   * Animation Frame Reference
   * 
   * Specifications:
   * - Stores the ID returned by requestAnimationFrame
   * - Enables proper cancellation of animation frames during cleanup
   */
  const requestAnimationIdRef = useRef<number | null>(null);

  /**
   * Webcam Setup Effect
   * 
   * Specifications:
   * - Sets up webcam access when component becomes active
   * - Configures video stream with appropriate parameters for performance
   * - Handles permission errors gracefully
   * - Properly cleans up resources when component unmounts or becomes inactive
   * - Triggers hand pose model loading when webcam is ready
   */
  useEffect(() => {
    // Don't attempt to access the camera if detection is not active
    if (!isActive) {
      return;
    }

    setIsLoading(true);
    setModelLoading(true);
    setError(null);

    /**
     * Setup Webcam Function
     * 
     * Specifications:
     * - Requests camera access with specific constraints for performance
     * - Attaches stream to video element when access is granted
     * - Handles errors and cleanup if permissions are denied
     * - Triggers model loading when webcam is ready
     */
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
        
        // After setting videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
            setIsLoading(false);
            loadHandPoseModel();
            }).catch(err => {
            setError("Error initializing video: " + err.message);
            setIsLoading(false);
            });
        };
  
      } catch (err) {
        // Handle errors when camera access is denied or not available
        setError("Could not access camera. Please check permissions.");
        setIsLoading(false);
      }
    };

    /**
     * Stop Stream Function
     * 
     * Specifications:
     * - Properly stops all tracks in the media stream
     * - Removes stream reference from video element
     * - Cleans up references to prevent memory leaks
     */
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
   * Load Hand Pose Model Function
   * 
   * Specifications:
   * - Initializes TensorFlow.js environment and sets optimal backend
   * - Loads the MediaPipe Hands model with configuration for best performance
   * - Handles errors during model loading
   * - Starts the prediction loop when model is ready
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
   * Classify Hand Pose Function
   * 
   * Specifications:
   * - Analyzes hand landmark positions to determine gesture type
   * - Implements rules for identifying thumbs up, down, and sideways gestures
   * - Considers relative positions of thumb, fingers, and wrist
   * - Returns the detected gesture ID or null if no recognizable gesture
   * 
   * @param hand - The hand object from the MediaPipe Hands model
   * @returns The detected gesture ID (THUMBS_UP, THUMBS_DOWN, THUMBS_SIDEWAYS, OTHER, or null)
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
   * Start Prediction Loop Function
   * 
   * Specifications:
   * - Implements the continuous detection cycle using requestAnimationFrame
   * - Checks if video and detector are ready before processing
   * - Performs hand detection on each video frame
   * - Classifies detected hand poses and reports results via callback
   * - Handles errors during detection without crashing
   * - Maintains the loop only while component is active
   */
  const startPredictionLoop = () => {
    // Only start if we have both the video element and the detector
    if (!videoRef.current || !detectorRef.current || !isActive) {
      return;
    }
    
    const video = videoRef.current;
    const detector = detectorRef.current;
    
    /**
     * Detect Hand Pose Function
     * 
     * Specifications:
     * - Processes individual video frames to detect hands
     * - Checks component and resource readiness before processing
     * - Calls the hand pose classifier on detected hands
     * - Reports gesture detection results through the callback
     * - Implements error handling for detection failures
     * - Maintains the detection loop through requestAnimationFrame
     */
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

  /**
   * Component Render
   * 
   * Specifications:
   * - Renders appropriate UI feedback based on current detection state
   * - Shows loading indicators for camera and model initialization
   * - Displays error messages when detection fails
   * - Includes a success message when detection is active
   * - Hides the video element as we don't need to display it to the user
   * - Maintains consistent styling in both light and dark modes
   */
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