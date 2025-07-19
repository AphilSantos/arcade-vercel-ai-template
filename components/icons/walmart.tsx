import * as React from 'react';
import type { SVGProps } from 'react';

const Walmart = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M12 0l3.09 9.26L24 9.27l-7.91 5.73L19.18 24 12 18.54 4.82 24l3.09-8.99L0 9.27l8.91-.01L12 0z" 
      fill="#0071CE"
    />
  </svg>
);

export default Walmart;