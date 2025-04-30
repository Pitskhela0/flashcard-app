import React, { useState } from "react";

interface CameraPermissionRequestProps {
  onRequestPermission: () => void;
}

/**
 * Component that explains the hand gesture feature and requests camera permission
 */
export default function CameraPermissionRequest({
  onRequestPermission
}: CameraPermissionRequestProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="camera-permission-request p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">
            Use Hand Gestures to Rate Cards
          </h3>
          
          {!expanded && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Enable your camera to use thumbs up/down gestures instead of clicking buttons.
            </p>
          )}
        </div>
        
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-blue-800 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-200"
        >
          {expanded ? "▲ Less" : "▼ More"}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4 text-sm text-blue-700 dark:text-blue-400 space-y-3">
          <p>
            This feature uses your webcam to detect hand gestures:
          </p>
          
          <div className="grid grid-cols-3 gap-4 my-3">
            <div className="text-center">
              <div className="text-3xl">👍</div>
              <div className="mt-1">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl">🤔</div>
              <div className="mt-1">Hard</div>
            </div>
            <div className="text-center">
              <div className="text-3xl">👎</div>
              <div className="mt-1">Wrong</div>
            </div>
          </div>
          
          <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
            <p className="mb-2">
              <strong>Privacy Note:</strong> All processing happens locally in your browser. 
              No video data is ever sent to any server.
            </p>
            
            <button
              onClick={onRequestPermission}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              Enable Camera Access
            </button>
          </div>
        </div>
      )}
    </div>
  );
}