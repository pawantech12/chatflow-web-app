import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useState } from "react";
import Picker from "@emoji-mart/react";

const EmojiPickerPortal = ({ targetRef, onEmojiSelect, onClose }) => {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    setContainer(div);

    const handleClickOutside = (e) => {
      if (targetRef.current && !targetRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.removeChild(div);
    };
  }, []);

  if (!container) return null;

  return createPortal(
    <div className="absolute z-50 shadow-lg rounded-lg overflow-hidden">
      <Picker onEmojiSelect={onEmojiSelect} />
    </div>,
    container
  );
};

export default EmojiPickerPortal;
