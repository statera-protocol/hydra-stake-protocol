import { useState, useEffect } from "react";

function useChrome() {
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    const checkChrome =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    setIsChrome(checkChrome);
  }, []);

  return isChrome;
}

export default useChrome;
