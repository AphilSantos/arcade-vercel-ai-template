import * as React from 'react';
import type { SVGProps } from 'react';

const Hubspot = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M18.164 7.931V5.91a3.91 3.91 0 1 0-7.82 0v2.021a5.958 5.958 0 1 0 3.91 11.159 5.958 5.958 0 0 0 3.91-11.159zm-3.91-2.021a1.955 1.955 0 1 1 3.91 0v2.021a5.958 5.958 0 0 0-3.91 0V5.91zm0 13.18a3.955 3.955 0 1 1 0-7.91 3.955 3.955 0 0 1 0 7.91z" 
      fill="#FF7A59"
    />
  </svg>
);

export default Hubspot;