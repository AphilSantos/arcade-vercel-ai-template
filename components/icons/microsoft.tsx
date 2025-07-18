import * as React from 'react';
import type { SVGProps } from 'react';

const Microsoft = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M0 0h11.377v11.372H0V0z" fill="#F25022" />
    <path d="M12.623 0H24v11.372H12.623V0z" fill="#7FBA00" />
    <path d="M0 12.623h11.377V24H0V12.623z" fill="#00A4EF" />
    <path d="M12.623 12.623H24V24H12.623V12.623z" fill="#FFB900" />
  </svg>
);

export default Microsoft;