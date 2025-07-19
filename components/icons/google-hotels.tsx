import * as React from 'react';
import type { SVGProps } from 'react';

const GoogleHotels = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V6H1v15h2v-3h18v3h2v-9c0-3.31-2.69-6-6-6z" 
      fill="#4285F4"
    />
  </svg>
);

export default GoogleHotels;
