import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `PulseGrid | ${title}` : "PulseGrid";
    return () => { document.title = "PulseGrid"; };
  }, [title]);
}
