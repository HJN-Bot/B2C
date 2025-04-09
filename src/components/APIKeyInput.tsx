
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOpenAIApiKey, setOpenAIApiKey } from "@/utils/audioRecorder";
import { useToast } from "@/hooks/use-toast";

interface APIKeyInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const APIKeyInput = ({ open, onOpenChange, onComplete }: APIKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = getOpenAIApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      // Set the provided API key if none is stored
      const defaultKey = "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";
      setApiKey(defaultKey);
      setOpenAIApiKey(defaultKey);
    }
  }, [open]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Test if the API key is valid
    fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          setOpenAIApiKey(apiKey);
          toast({
            title: "API Key Saved",
            description: "Your OpenAI API key has been saved",
          });
          onOpenChange(false);
          if (onComplete) onComplete();
        } else {
          toast({
            title: "Invalid API Key",
            description: "The API key you entered is invalid",
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        console.error("Error validating API key:", error);
        toast({
          title: "Validation Error",
          description: "Could not validate the API key. It will be saved anyway.",
        });
        setOpenAIApiKey(apiKey);
        onOpenChange(false);
        if (onComplete) onComplete();
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to enable voice analysis features.
            Your key will be stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full"
            type="password"
          />
          <p className="text-xs text-gray-500">
            Your API key is stored only in your browser's local storage and is not transmitted 
            to any servers other than OpenAI's API endpoints.
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Validating..." : "Save Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default APIKeyInput;
