import * as React from 'react';
import type { SVGProps } from 'react';

const GoogleDrive = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M7.71 3.5L1.15 15l4.55 7.5h9.2l4.55-7.5L12.85 3.5H7.71z" 
      fill="#4285F4"
    />
    <path 
      d="M8.8 5.5h6.4L19.4 15H4.6L8.8 5.5z" 
      fill="#34A853"
    />
    <path 
      d="M12 8.5L8.5 15h7L12 8.5z" 
      fill="#FBBC05"
    />
  </svg>
);

export default GoogleDrive;
