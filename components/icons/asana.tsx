import * as React from 'react';
import type { SVGProps } from 'react';

const Asana = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="8.5" cy="12" r="2.5" fill="#F06A6A" />
    <circle cx="15.5" cy="12" r="2.5" fill="#F06A6A" />
    <circle cx="12" cy="7" r="2.5" fill="#F06A6A" />
  </svg>
);

export default Asana;
