/**
 * GestureIcons Component
 * 
 * Specifications:
 * - Provides a collection of SVG icons for the gesture control system
 * - Implements consistent styling and dimensions across all icons
 * - Includes icons for: thumbs up, thumbs down, thumbs sideways, camera, camera off, and hand
 * - Each icon is a functional component that accepts optional className prop for customization
 * - All icons use the currentColor value to inherit color from parent elements
 * - Icons maintain accessibility best practices with proper viewBox and dimensions
 * - SVG paths are optimized for clean rendering at various sizes
 * - All icons follow a consistent design language
 */
import React from 'react';

interface IconProps {
  className?: string;
}

export const ThumbsUpIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 3C11.5 3 11 3.2 10.6 3.6L5.7 8.5C5.3 8.9 5 9.4 5 10C5 11.1 5.9 12 7 12H10V19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19V12H17C18.1 12 19 11.1 19 10C19 9.4 18.7 8.9 18.3 8.5L13.4 3.6C13 3.2 12.5 3 12 3Z" 
      fill="currentColor"
    />
  </svg>
);

export const ThumbsDownIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 21C12.5 21 13 20.8 13.4 20.4L18.3 15.5C18.7 15.1 19 14.6 19 14C19 12.9 18.1 12 17 12H14V5C14 3.9 13.1 3 12 3C10.9 3 10 3.9 10 5V12H7C5.9 12 5 12.9 5 14C5 14.6 5.3 15.1 5.7 15.5L10.6 20.4C11 20.8 11.5 21 12 21Z" 
      fill="currentColor"
    />
  </svg>
);

export const ThumbsSidewaysIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 12C4 11.5 4.2 11 4.6 10.6L9.5 5.7C9.9 5.3 10.4 5 11 5C12.1 5 13 5.9 13 7V10H20C21.1 10 22 10.9 22 12C22 13.1 21.1 14 20 14H13V17C13 18.1 12.1 19 11 19C10.4 19 9.9 18.7 9.5 18.3L4.6 13.4C4.2 13 4 12.5 4 12Z" 
      fill="currentColor"
    />
  </svg>
);

export const CameraIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" 
      fill="currentColor" 
    />
    <path 
      d="M20 4H16.83L15 2H9L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" 
      fill="currentColor" 
    />
  </svg>
);

export const CameraOffIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M21.9 21.9L2.1 2.1L2.1 2.09997C1.71 2.49997 1.71 3.12997 2.1 3.51997L4.12 5.54997L4 6V18C4 19.1 4.9 20 6 20H18C18.21 20 18.39 19.97 18.57 19.91L20.48 21.82C20.87 22.21 21.5 22.21 21.9 21.82C22.29 21.43 22.29 20.8 21.9 20.4V21.9ZM7.67 9.09997L9 10.43C9.15 9.97997 9.38 9.56997 9.67 9.21997C9.95 8.86997 10.31 8.56997 10.7 8.34997C11.1 8.12997 11.53 7.99997 12 7.99997C12.47 7.99997 12.9 8.11997 13.29 8.33997C13.68 8.55997 14.05 8.84997 14.33 9.19997C14.61 9.54997 14.84 9.95997 15 10.41L16.33 11.74C16.36 11.5 16.38 11.25 16.38 11C16.38 10.43 16.27 9.88997 16.06 9.38997C15.85 8.88997 15.56 8.44997 15.19 8.07997C14.82 7.71997 14.38 7.42997 13.88 7.21997C13.38 7.00997 12.84 6.89997 12.27 6.89997C11.7 6.89997 11.15 7.00997 10.65 7.21997C10.15 7.42997 9.71 7.71997 9.34 8.07997C8.97 8.43997 8.68 8.87997 8.47 9.37997C8.26 9.87997 8.15 10.43 8.15 10.99C8.15 11.02 8.15 11.05 8.15 11.08C8.21 10.42 8.36 9.77997 7.67 9.09997ZM6 18H18C18.55 18 19 17.55 19 17V7.89997L7.89 19H6V18ZM19.46 5.46997L20 4.99997V6.99997C20 7.54997 19.55 7.99997 19 7.99997H17L18 6.99997L16 4.99997H17.17L15.51 3.33997C15.12 2.94997 14.5 2.94997 14.1 3.33997C13.71 3.72997 13.71 4.35997 14.1 4.74997L16.89 7.53997L19.46 10.11L20.87 11.52C21.26 11.91 21.89 11.91 22.28 11.52C22.67 11.13 22.67 10.5 22.28 10.11L19.46 7.28997V5.46997Z" 
      fill="currentColor" 
    />
  </svg>
);

export const HandIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M13 3C11.9 3 11 3.9 11 5V9.25C10.58 9.08 10.3 8.67 10.3 8.2V5C10.3 4.39 9.91 3.86 9.33 3.68C8.41 3.38 7.5 4.09 7.5 5V8.2C7.5 8.67 7.23 9.08 6.8 9.25V5C6.8 4.39 6.41 3.86 5.83 3.68C4.91 3.38 4 4.09 4 5V14.17L3.83 14C3.11 13.28 1.92 13.28 1.2 14C0.48 14.72 0.48 15.91 1.2 16.63L5.86 21.29C6.53 21.96 7.4 22.43 8.36 22.66C9.22 22.87 10.11 22.98 11 22.98H14.9C16.36 22.98 17.72 22.47 18.75 21.55C19.78 20.64 20.5 19.31 20.5 17.83V8C20.5 7.67 20.4 7.35 20.22 7.09C19.88 6.56 19.21 6.27 18.55 6.39L18.42 6.43C18.12 6.52 17.85 6.69 17.65 6.92C17.55 7.04 17.48 7.18 17.4 7.32C17.01 7.04 16.51 6.9 16 6.9C14.94 6.9 13.91 7.35 13.28 8.2C13.28 8.2 13.12 8.43 13 8.55V3Z" 
      fill="currentColor" 
    />
  </svg>
);