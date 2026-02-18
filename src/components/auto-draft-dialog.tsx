"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus } from "lucide-react";

type MatchmakingProfile = {
  id: string;
  name: string;
};

type AutoDraftDialogProps = {
  open: boolean;
  onClose: () => void;
  maxDrafts: number;
  profiles: MatchmakingProfile[];
  defaultProfileId: string | null;
  onGenerate: (count: number, profileId: string) => void;
};

export function AutoDraftDialog({
  open,
  onClose,
  maxDrafts,
  profiles,
  defaultProfileId,
  onGenerate,
}: AutoDraftDialogProps) {
  const [count, setCount] = useState(maxDrafts);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    defaultProfileId ?? profiles[0]?.id ?? ""
  );

  // Reset to defaults each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setCount(Math.max(1, maxDrafts));
    setSelectedProfileId(defaultProfileId ?? profiles[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canGenerate = count >= 1 && selectedProfileId !== "";

  function handleGenerate() {
    if (!canGenerate) return;
    onGenerate(count, selectedProfileId);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Auto Draft Matches</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Draft count */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Number of Drafts</p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                disabled={count <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center font-medium tabular-nums">
                {count}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setCount((c) => Math.min(maxDrafts, c + 1))}
                disabled={count >= maxDrafts}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground">
                max {maxDrafts}
              </span>
            </div>
          </div>

          {/* Profile selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Matchmaking Profile</Label>
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No profiles available.
              </p>
            ) : (
              <Select
                value={selectedProfileId}
                onValueChange={setSelectedProfileId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                      {profile.id === defaultProfileId && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          (default)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
