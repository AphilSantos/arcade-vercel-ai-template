import * as React from 'react';
import type { SVGProps } from 'react';

const Firecrawl = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M12 2c-1.1 0-2 .9-2 2 0 .74.4 1.38 1 1.73V7h2V5.73c.6-.35 1-.99 1-1.73 0-1.1-.9-2-2-2zm-8 8c0-4.42 3.58-8 8-8s8 3.58 8 8c0 2.21-.9 4.21-2.35 5.65L12 22l-5.65-6.35C5.9 14.21 5 12.21 5 10h2c0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6-6 2.69-6 6H4z" 
      fill="#FF4500"
    />
  </svg>
);

export default Firecrawl;