
import { useState, useEffect } from "react";
import { Smile, Heart, Star, ThumbsUp, CircleCheck } from "lucide-react";

type Reaction = {
  emoji: JSX.Element;
  comment: string;
};

interface LiveReactionFeedbackProps {
  isActive: boolean;
}

const LiveReactionFeedback = ({ isActive }: LiveReactionFeedbackProps) => {
  const [currentReaction, setCurrentReaction] = useState<Reaction | null>(null);
  const [visible, setVisible] = useState(false);

  const reactions: Reaction[] = [
    { emoji: <Smile className="text-yellow-400" size={28} />, comment: "Nice speed!" },
    { emoji: <Heart className="text-red-500" size={28} />, comment: "Good point!" },
    { emoji: <Star className="text-amber-400" size={28} />, comment: "Very clear!" },
    { emoji: <ThumbsUp className="text-blue-500" size={28} />, comment: "I like that last one!" },
    { emoji: <CircleCheck className="text-green-500" size={28} />, comment: "Excellent!" },
    { emoji: <Smile className="text-yellow-400" size={28} />, comment: "Well done!" },
    { emoji: <Star className="text-amber-400" size={28} />, comment: "Keep going!" },
    { emoji: <Heart className="text-red-500" size={28} />, comment: "Perfect!" },
  ];

  useEffect(() => {
    if (!isActive) {
      setVisible(false);
      return;
    }

    const showReaction = () => {
      // Select a random reaction
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      setCurrentReaction(randomReaction);
      setVisible(true);

      // Hide the reaction after a few seconds
      setTimeout(() => {
        setVisible(false);
      }, 2500);
    };

    // Show initial reaction after a short delay
    const initialTimer = setTimeout(() => {
      showReaction();
    }, 2000);

    // Set up interval for periodic reactions
    const intervalTimer = setInterval(() => {
      showReaction();
    }, 7000); // Show a reaction every 7 seconds

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isActive]);

  if (!isActive || !visible || !currentReaction) {
    return null;
  }

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md mb-2">
        {currentReaction.emoji}
      </div>
      <p className="text-sm font-medium">{currentReaction.comment}</p>
    </div>
  );
};

export default LiveReactionFeedback;
