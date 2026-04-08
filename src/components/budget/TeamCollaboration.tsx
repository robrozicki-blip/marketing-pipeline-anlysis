import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Share {
  id: string;
  shared_with_email: string;
  permission: string;
  created_at: string;
}

export function TeamCollaboration() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");

  useEffect(() => {
    if (open) {
      loadScenarios();
      loadShares();
    }
  }, [open]);

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_scenarios")
        .select("id, name")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setScenarios(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading scenarios:", error);
      }
    }
  };

  const loadShares = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_shares")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading shares:", error);
      }
    }
  };

  const shareScenario = async () => {
    if (!email || !selectedScenario) {
      toast({
        title: "Error",
        description: "Please select a scenario and enter an email",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("budget_shares")
        .insert([{
          scenario_id: selectedScenario,
          shared_with_email: email,
          permission,
          created_by: userData.user.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Scenario shared with ${email}`,
      });

      setEmail("");
      setSelectedScenario("");
      setPermission("view");
      loadShares();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error sharing scenario:", error);
      }
      toast({
        title: "Error",
        description: "Failed to share scenario",
        variant: "destructive",
      });
    }
  };

  const deleteShare = async (id: string) => {
    try {
      const { error } = await supabase
        .from("budget_shares")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Share removed successfully",
      });
      loadShares();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error deleting share:", error);
      }
      toast({
        title: "Error",
        description: "Failed to remove share",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Team Collaboration</DialogTitle>
          <DialogDescription>
            Share scenarios with your team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Share Scenario</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Scenario</Label>
                <Select
                  value={selectedScenario}
                  onValueChange={setSelectedScenario}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Permission</Label>
                <Select
                  value={permission}
                  onValueChange={(value: "view" | "edit") => setPermission(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={shareScenario} size="sm" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Share Scenario
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Active Shares</h4>
            {shares.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active shares yet
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{share.shared_with_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Permission: {share.permission} • Shared{" "}
                        {new Date(share.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteShare(share.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
