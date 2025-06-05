import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EarlyFeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  generationCount: number;
}

export function EarlyFeedbackPopup({ isOpen, onClose, generationCount }: EarlyFeedbackPopupProps) {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please provide a rating",
        description: "Select at least one star to continue",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Log feedback submission
      console.log(`[FEEDBACK_SUBMITTED] Rating: ${rating}/5, Generations: ${generationCount}, Feedback: ${feedback}`);
      
      // In production, this would send to a feedback service or database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve GhostliAI for everyone."
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              How's your GhostliAI experience so far?
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            You've completed {generationCount} content generations. We'd love your feedback!
          </div>
          
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate your experience:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Feedback Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              What can we improve? (optional)
            </label>
            <Textarea
              placeholder="Share your thoughts, suggestions, or any issues you've encountered..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}