import * as React from 'react';
import type { SVGProps } from 'react';

const Jira = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z" 
      fill="#0052CC"
    />
    <path 
      d="M17.294 5.757H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129V8.915A5.214 5.214 0 0 0 18.294 0V6.757a1.005 1.005 0 0 0-1.005 1.005z" 
      fill="#2684FF"
    />
  </svg>
);

export default Jira;