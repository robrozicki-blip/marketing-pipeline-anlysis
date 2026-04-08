import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BudgetData } from "@/lib/budgetCalculations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, FolderOpen, Trash2, Copy } from "lucide-react";

interface ScenarioManagerProps {
  budgetData: BudgetData;
  onLoadScenario: (scenario: Scenario) => void;
  currentScenarioId?: string | null;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  budget_data: BudgetData;
  created_at: string;
  updated_at: string;
}

export function ScenarioManager({ budgetData, onLoadScenario, currentScenarioId }: ScenarioManagerProps) {
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_scenarios")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setScenarios((data || []) as unknown as Scenario[]);
    } catch (error) {
      console.error("Error loading scenarios:", error);
    }
  };

  const saveScenario = async () => {
    if (!scenarioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scenario name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      if (currentScenarioId) {
        // Update existing scenario
        const { error } = await supabase
          .from("budget_scenarios")
          .update({
            name: scenarioName,
            description: scenarioDescription,
            budget_data: budgetData as any,
          })
          .eq("id", currentScenarioId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Scenario updated successfully",
        });
      } else {
        // Insert new scenario
        const { error } = await supabase
          .from("budget_scenarios")
          .insert([{
            user_id: userData.user.id,
            name: scenarioName,
            description: scenarioDescription,
            budget_data: budgetData as any,
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Scenario saved successfully",
        });
      }

      setScenarioName("");
      setScenarioDescription("");
      setSaveDialogOpen(false);
      loadScenarios();
    } catch (error) {
      console.error("Error saving scenario:", error);
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteScenario = async (id: string) => {
    try {
      const { error } = await supabase
        .from("budget_scenarios")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });
      loadScenarios();
    } catch (error) {
      console.error("Error deleting scenario:", error);
      toast({
        title: "Error",
        description: "Failed to delete scenario",
        variant: "destructive",
      });
    }
  };

  const duplicateScenario = async (scenario: Scenario) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("budget_scenarios")
        .insert([{
          user_id: userData.user.id,
          name: `${scenario.name} (Copy)`,
          description: scenario.description,
          budget_data: scenario.budget_data as any,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scenario duplicated successfully",
      });
      loadScenarios();
    } catch (error) {
      console.error("Error duplicating scenario:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate scenario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scenario Manager</CardTitle>
          <div className="flex gap-2">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Pre-fill name and description if editing existing scenario
                    if (currentScenarioId) {
                      const currentScenario = scenarios.find(s => s.id === currentScenarioId);
                      if (currentScenario) {
                        setScenarioName(currentScenario.name);
                        setScenarioDescription(currentScenario.description || "");
                      }
                    } else {
                      setScenarioName("");
                      setScenarioDescription("");
                    }
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {currentScenarioId ? "Update" : "Save"} Scenario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{currentScenarioId ? "Update" : "Save"} Current Scenario</DialogTitle>
                  <DialogDescription>
                    {currentScenarioId 
                      ? "Update the currently loaded scenario with your changes"
                      : "Save your current budget configuration for later use"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Scenario Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Q1 2026 Plan"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add notes about this scenario..."
                      value={scenarioDescription}
                      onChange={(e) => setScenarioDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveScenario} disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load Scenario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Load Saved Scenario</DialogTitle>
                  <DialogDescription>
                    Select a scenario to load into the planner
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scenarios.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No saved scenarios yet. Save your current budget to create one.
                    </p>
                  ) : (
                    scenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{scenario.name}</h4>
                          {scenario.description && (
                            <p className="text-sm text-muted-foreground">
                              {scenario.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Updated: {new Date(scenario.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicateScenario(scenario)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteScenario(scenario.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              onLoadScenario(scenario);
                              setLoadDialogOpen(false);
                              toast({
                                title: "Scenario Loaded",
                                description: `Loaded "${scenario.name}"`,
                              });
                            }}
                          >
                            Load
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
