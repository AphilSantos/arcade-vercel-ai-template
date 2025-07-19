import * as React from 'react';
import type { SVGProps } from 'react';

const GoogleJobs = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M20 6h-2.5l-1.5-1.5h-5L9.5 6H7c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H7V8h2.5l1.5-1.5h3L15.5 8H20v10z" 
      fill="#4285F4"
    />
  </svg>
);

export default GoogleJobs;