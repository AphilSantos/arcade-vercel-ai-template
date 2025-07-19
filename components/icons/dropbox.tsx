import * as React from 'react';
import type { SVGProps } from 'react';

const Dropbox = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M6 2L12 6 6 10 0 6zm12 0l6 4-6 4-6-4zm-6 8l6 4-6 4-6-4zm-6 0l6 4v4l-6-4zm12 0v4l-6 4v-4z" 
      fill="#0061FF"
    />
  </svg>
);

export default Dropbox;
