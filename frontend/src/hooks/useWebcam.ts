/**
 * useWebcam Hook
 * 
 * Specifications:
 * - Provides a custom React hook for managing webcam access and state
 * - Handles requesting camera permissions from the browser
 * - Sets up and tears down webcam stream properly to prevent memory leaks
 * - Maintains state about webcam readiness and error conditions
 * - Returns references and state needed for webcam integration
 * - Can be activated/deactivated via an isActive parameter
 * - Properly stops all media tracks when deactivated or unmounted
 */
import { useState, useEffect, useRef } from 'react';

/**
 * Hook Return Interface
 * 
 * Specifications:
 * - videoRef: Reference to the video element to attach the webcam stream
 * - isWebcamReady: Boolean indicating if the webcam is initialized and ready
 * - error: Error message if webcam access failed, null otherwise
 */
interface UseWebcamReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isWebcamReady: boolean;
    error: string | null;
}

/**
 * useWebcam Hook
 * 
 * Specifications:
 * - Manages webcam access lifecycle
 * - Handles browser permissions and media stream setup
 * - Provides state for UI feedback about webcam status
 * - Cleans up resources when deactivated or unmounted
 * 
 * @param isActive Whether the webcam should be active (default: true)
 * @returns Object containing video reference, ready state, and error state
 */
export function useWebcam(isActive: boolean = true): UseWebcamReturn {
    /**
     * State and Refs
     * 
     * Specifications:
     * - videoRef: Reference to the video element in the DOM
     * - streamRef: Reference to the active MediaStream for cleanup
     * - isWebcamReady: State tracking whether webcam is fully initialized
     * - error: State for storing any webcam access errors
     */
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isWebcamReady, setIsWebcamReady] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Webcam Setup Effect
     * 
     * Specifications:
     * - Handles the complete lifecycle of webcam access
     * - Requests permission when component activates
     * - Attaches stream to video element when permission granted
     * - Updates ready state when video can play
     * - Handles permission denial with appropriate error messages
     * - Cleans up stream and resets state when deactivated
     * - Properly releases all media tracks on cleanup
     */
    useEffect(() => {
        /**
         * Setup Camera Function
         * 
         * Specifications:
         * - Handles the async process of requesting camera permissions
         * - Configures video constraints for optimal performance
         * - Attaches stream to video element when available
         * - Updates ready state when playback begins
         * - Sets appropriate error states on failure
         */
        async function setupCamera() {
            // if the webcam is inactive, stop every existing stream and reset state
            if (!isActive) {
                if (streamRef.current) {
                    // stop media tracks
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                // update state of readiness
                setIsWebcamReady(false);
                return;
            }

            try {
                // request webcam access, returns Promise
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 640,
                        height: 480,
                        facingMode: 'user' // front camera
                    }
                });

                // store mediaStream object
                streamRef.current = stream;

                // if video element ref exists, attach the stream to it
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    // play the video
                    videoRef.current.onloadedmetadata = () => {
                        // check for videoRef
                        if (videoRef.current) {
                            videoRef.current.play(); // start video playback
                            setIsWebcamReady(true);
                        }
                    };
                }
            } catch (error) {
                console.error('error during access webcam: ', error);
                setError('Ensure camera permissions are in our hand 👀');
            }
        }

        // Call setupCamera once when the effect runs
        setupCamera();

        /**
         * Cleanup Function
         * 
         * Specifications:
         * - Stops all tracks in the media stream
         * - Clears the stream reference
         * - Prevents memory leaks from lingering media connections
         */
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [isActive]);

    /**
     * Return Hook Interface
     * 
     * Specifications: 
     * - videoRef: Reference to attach to a video element in the DOM
     * - isWebcamReady: Whether the webcam is initialized and ready
     * - error: Error message if access failed, null otherwise
     */
    return { videoRef, isWebcamReady, error };
}