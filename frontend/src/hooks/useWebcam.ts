import { useState, useEffect, useRef } from 'react';

interface UseWebcamReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isWebcamReady: boolean;
    error: string | null;
}

// my hook to handle webcam access
export function useWebcam(isActive: boolean = true): UseWebcamReturn {
    // reference to <video> element in the DOM
    const videoRef = useRef<HTMLVideoElement>(null);
    // mediaStream object
    const streamRef = useRef<MediaStream | null>(null);
    
    // webcam flag
    const [isWebcamReady, setIsWebcamReady] = useState<boolean>(false);
    // error indicator
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // initializing webcam
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

                // mediaStream object
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

        // Cleanup function to stop webcam and clear stream object
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [isActive]);

    return { videoRef, isWebcamReady, error };
}