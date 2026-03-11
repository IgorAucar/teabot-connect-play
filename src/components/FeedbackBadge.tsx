import { useEffect, useState } from "react";

interface FeedbackBadgeProps {
  message: string;
  visible: boolean;
}

const FeedbackBadge = ({ message, visible }: FeedbackBadgeProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div className="flex justify-start pl-14">
      <span className="animate-feedback-bloom rounded-full bg-accent px-4 py-1.5 font-heading text-sm font-bold text-accent-foreground shadow-md">
        {message}
      </span>
    </div>
  );
};

export default FeedbackBadge;
