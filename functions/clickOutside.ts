import React, { useRef, useEffect, Ref } from "react";
// import { JsxElement } from "typescript";

/**
 * Hook that alerts clicks outside of the passed ref
 */
export function useOutsideAlerter(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        alert("You clicked outside of me!");
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
}

/**
 * Component that alerts if you click outside of it
 */
// export default function OutsideAlerter(props: JsxElement) {
//   const wrapperRef = useRef(null);
//   useOutsideAlerter(wrapperRef);

//   return <div ref={wrapperRef}>{props.children}</div>;
// }
