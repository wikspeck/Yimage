import { useEffect, useState } from "react";
import { readPostActionState, writePostActionState } from "../utils/postActionState";

export default function usePersistentPostActionState(action, postId, user) {
  const [active, setActive] = useState(() => readPostActionState(action, postId, user));

  useEffect(() => {
    setActive(readPostActionState(action, postId, user));
  }, [action, postId, user?.id, user?.username]);

  function markActive(nextActive = true) {
    setActive(nextActive);
    writePostActionState(action, postId, user, nextActive);
  }

  return [active, markActive];
}
