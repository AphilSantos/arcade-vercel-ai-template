import * as React from 'react';
import type { SVGProps } from 'react';

const E2b = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M12 2L2 7l10 5 10-5-10-5z" 
      fill="#FF6B35"
    />
    <path 
      d="M2 17l10 5 10-5" 
      fill="#FF6B35"
    />
    <path 
      d="M2 12l10 5 10-5" 
      fill="#FF6B35"
    />
  </svg>
);

export default E2b;
