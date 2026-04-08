import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, FolderOpen, Trash2, Copy, FileText } from "lucide-react";
import { PlannerConfig, PlanningMode } from "@/hooks/useROIPlanner";

interface PlannerScenarioData {
  mode: PlanningMode;
  config: PlannerConfig;
  targetARR: number;
  yearlyBudget: number;
}

interface PlannerScenario {
  id: string;
  name: string;
  description: string;
  budget_data: PlannerScenarioData;
  created_at: string;
  updated_at: string;
}

interface PlannerScenarioManagerProps {
  mode: PlanningMode;
  config: PlannerConfig;
  targetARR: number;
  yearlyBudget: number;
  onLoadScenario: (data: PlannerScenarioData) => void;
}

export function PlannerScenarioManager({
  mode,
  config,
  targetARR,
  yearlyBudget,
  onLoadScenario,
}: PlannerScenarioManagerProps) {
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<PlannerScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);

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
      setScenarios((data || []) as unknown as PlannerScenario[]);
    } catch (error) {
      console.error("Error loading scenarios:", error);
    }
  };

  const saveScenario = async (saveAsNew: boolean = false) => {
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

      const scenarioData: PlannerScenarioData = {
        mode,
        config,
        targetARR,
        yearlyBudget,
      };

      if (currentScenarioId && !saveAsNew) {
        const { error } = await supabase
          .from("budget_scenarios")
          .update({
            name: scenarioName,
            description: scenarioDescription,
            budget_data: scenarioData as any,
          })
          .eq("id", currentScenarioId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Scenario updated successfully",
        });
      } else {
        const { data, error } = await supabase.from("budget_scenarios").insert([
          {
            user_id: userData.user.id,
            name: saveAsNew ? scenarioName : scenarioName,
            description: scenarioDescription,
            budget_data: scenarioData as any,
          },
        ]).select();

        if (error) throw error;

        // Set the new scenario as current
        if (data && data.length > 0) {
          setCurrentScenarioId(data[0].id);
        }

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

  const quickSave = async () => {
    if (!currentScenarioId) return;

    setLoading(true);
    try {
      const scenarioData: PlannerScenarioData = {
        mode,
        config,
        targetARR,
        yearlyBudget,
      };

      const { error } = await supabase
        .from("budget_scenarios")
        .update({
          budget_data: scenarioData as any,
        })
        .eq("id", currentScenarioId);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Changes saved",
      });
      loadScenarios();
    } catch (error) {
      console.error("Error saving scenario:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setScenarioToDelete(id);
    setDeleteDialogOpen(true);
  };

  const deleteScenario = async () => {
    if (!scenarioToDelete) return;

    try {
      const { error } = await supabase
        .from("budget_scenarios")
        .delete()
        .eq("id", scenarioToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });

      if (currentScenarioId === scenarioToDelete) {
        setCurrentScenarioId(null);
      }

      loadScenarios();
    } catch (error) {
      console.error("Error deleting scenario:", error);
      toast({
        title: "Error",
        description: "Failed to delete scenario",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setScenarioToDelete(null);
    }
  };

  const duplicateScenario = async (scenario: PlannerScenario) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("budget_scenarios").insert([
        {
          user_id: userData.user.id,
          name: `${scenario.name} (Copy)`,
          description: scenario.description,
          budget_data: scenario.budget_data as any,
        },
      ]);

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

  const handleLoadScenario = (scenario: PlannerScenario) => {
    onLoadScenario(scenario.budget_data);
    setCurrentScenarioId(scenario.id);
    setLoadDialogOpen(false);
    toast({
      title: "Scenario Loaded",
      description: `Loaded "${scenario.name}"`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Scenarios
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Save and compare different planning scenarios
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentScenarioId && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
              <div>
                Currently editing:{" "}
                <span className="font-medium text-foreground">
                  {scenarios.find((s) => s.id === currentScenarioId)?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={quickSave}
                disabled={loading}
              >
                <Save className="h-3 w-3 mr-1" />
                {loading ? "..." : "Save"}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (currentScenarioId) {
                      const currentScenario = scenarios.find(
                        (s) => s.id === currentScenarioId
                      );
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
                  {currentScenarioId ? "Update" : "Save"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {currentScenarioId ? "Update" : "Save"} Scenario
                  </DialogTitle>
                  <DialogDescription>
                    {currentScenarioId
                      ? "Update the currently loaded scenario with your changes"
                      : "Save your current planner configuration for later use"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Scenario Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Aggressive Growth Q1"
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
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSaveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  {currentScenarioId && (
                    <Button
                      variant="secondary"
                      onClick={() => saveScenario(true)}
                      disabled={loading}
                    >
                      Save as New
                    </Button>
                  )}
                  <Button onClick={() => saveScenario(false)} disabled={loading}>
                    {loading ? "Saving..." : currentScenarioId ? "Update" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load
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
                      No saved scenarios yet. Save your current configuration to
                      create one.
                    </p>
                  ) : (
                    scenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-accent ${
                          currentScenarioId === scenario.id
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{scenario.name}</h4>
                          {scenario.description && (
                            <p className="text-sm text-muted-foreground">
                              {scenario.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Updated:{" "}
                            {new Date(scenario.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicateScenario(scenario)}
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => confirmDelete(scenario.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleLoadScenario(scenario)}
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

          {!currentScenarioId && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                setScenarioName("");
                setScenarioDescription("");
                setSaveDialogOpen(true);
              }}
            >
              + Save as new scenario
            </Button>
          )}

          {currentScenarioId && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                setCurrentScenarioId(null);
                setScenarioName("");
                setScenarioDescription("");
              }}
            >
              Start fresh (unsaved)
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scenario?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              scenario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteScenario}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
