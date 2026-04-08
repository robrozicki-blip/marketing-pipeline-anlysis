import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  alert_type: string;
  metric: string;
  threshold: number;
  enabled: boolean;
}

export function AlertsManager() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState({
    metric: "cac_per_customer",
    threshold: 0,
    alert_type: "threshold_exceeded",
  });

  useEffect(() => {
    if (open) {
      loadAlerts();
    }
  }, [open]);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  const addAlert = async () => {
    if (!newAlert.threshold) {
      toast({
        title: "Error",
        description: "Please enter a threshold value",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("budget_alerts")
        .insert({
          user_id: userData.user.id,
          alert_type: newAlert.alert_type,
          metric: newAlert.metric,
          threshold: newAlert.threshold,
          enabled: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert created successfully",
      });

      setNewAlert({ metric: "cac_per_customer", threshold: 0, alert_type: "threshold_exceeded" });
      loadAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      });
    }
  };

  const toggleAlert = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("budget_alerts")
        .update({ enabled })
        .eq("id", id);

      if (error) throw error;
      loadAlerts();
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("budget_alerts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert deleted successfully",
      });
      loadAlerts();
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  const metricLabels: Record<string, string> = {
    cac_per_customer: "CAC per Customer",
    cac_ratio: "CAC Ratio",
    payback_period: "Payback Period",
    ltv_cac_ratio: "LTV:CAC Ratio",
    budget_variance: "Budget Variance %",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Alerts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Budget Alerts</DialogTitle>
          <DialogDescription>
            Configure alerts for key budget metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Create New Alert</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Metric</Label>
                <Select
                  value={newAlert.metric}
                  onValueChange={(value) => setNewAlert({ ...newAlert, metric: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(metricLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newAlert.alert_type}
                  onValueChange={(value) => setNewAlert({ ...newAlert, alert_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="threshold_exceeded">Exceeds</SelectItem>
                    <SelectItem value="threshold_below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addAlert} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Alert
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Active Alerts</h4>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No alerts configured yet
              </p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {metricLabels[alert.metric] || alert.metric}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Alert when {alert.alert_type === "threshold_exceeded" ? "exceeds" : "below"}{" "}
                        {alert.threshold}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
