import {useState, useEffect, useRef} from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

// return type go brr
interface UseHandPoseDetectionReturn {
    detector: handPoseDetection.HandDetector | null;
    isModelLoading: boolean;
    modelError: string | null;
}

export function useHandPoseDetection(isActive: boolean = true): UseHandPoseDetectionReturn{
    const [detector, setDetector] = useState<handPoseDetection.HandDetector | null>(null);
    const [isModelLoading, setModelLoading] = useState<boolean>(false);
    const [modelError, setModelError] = useState<string | null>(null);
    // void because it does not return anything, just gives me info about loading
    const modelLoadingPromiseRef = useRef<Promise<void> | null>(null);


    useEffect(() => {
        // skip if not active
        if(!isActive){
            return;
        }
    
        async function loadModel() {
            // if model is already loaded or loading, exit 
            if(detector !== null || isModelLoading){
                return;
            }
            setModelLoading(true);
            setModelError(null);

            try {
                // wait till ready! mochqares mougviandes (returns Promise)
                await tf.ready();

                // creating hand gesture detector
                const model =  handPoseDetection.SupportedModels.MediaPipeHands;
                const detectorConfig = {
                    runtime: 'tfjs',
                    modelType: 'lite', // faster model, could be used full
                    maxHands: 1
                };

                const handDetector = await handPoseDetection.createDetector(
                    model,
                    detectorConfig as handPoseDetection.MediaPipeHandsMediaPipeModelConfig
                );
                
                // stored hand model in state
                setDetector(handDetector);
                
            } catch (error) {
                console.error('error during loading hand pose model: ',error);
                setModelError('Try again to pose your hands');
            }
            finally{
                setModelLoading(false);
            }

            // we need loadModel run only once
            if(!modelLoadingPromiseRef.current){
                modelLoadingPromiseRef.current = loadModel();
            }
            else{
                modelLoadingPromiseRef.current.then(loadModel);
            }
        }
    }, [isActive, detector, isModelLoading]);


    return { detector, isModelLoading, modelError };

}