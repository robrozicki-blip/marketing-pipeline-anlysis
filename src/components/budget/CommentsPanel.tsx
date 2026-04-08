import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  user_id: string;
  section: string;
  comment: string;
  created_at: string;
}

interface CommentsPanelProps {
  scenarioId?: string;
}

export function CommentsPanel({ scenarioId }: CommentsPanelProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedSection, setSelectedSection] = useState("general");
  const [loading, setLoading] = useState(false);

  const sections = [
    { value: "general", label: "General" },
    { value: "budget_allocation", label: "Budget Allocation" },
    { value: "metrics_overview", label: "Metrics Overview" },
    { value: "efficiency", label: "Efficiency Metrics" },
    { value: "funnel", label: "Sales Funnel" },
    { value: "scenario_builder", label: "Scenario Builder" },
  ];

  useEffect(() => {
    if (scenarioId) {
      loadComments();
    }
  }, [scenarioId]);

  const loadComments = async () => {
    if (!scenarioId) return;

    try {
      const { data, error } = await supabase
        .from("budget_comments")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    if (!scenarioId) {
      toast({
        title: "Error",
        description: "Save a scenario first to add comments",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("budget_comments")
        .insert([{
          scenario_id: scenarioId,
          user_id: userData.user.id,
          section: selectedSection,
          comment: newComment,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment added successfully",
      });

      setNewComment("");
      loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (id: string, userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || userData.user.id !== userId) {
        toast({
          title: "Error",
          description: "You can only delete your own comments",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("budget_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
      loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.value} value={section.value}>
                  {section.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Add a comment or note..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />

          <Button onClick={addComment} disabled={loading} className="w-full h-9" size="sm">
            {loading ? "Adding..." : "Add Comment"}
          </Button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No comments yet. {!scenarioId && "Save a scenario to start adding comments."}
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-2.5 border rounded-lg space-y-1.5 bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-primary">
                        {sections.find((s) => s.value === comment.section)?.label || comment.section}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs mt-1 break-words">{comment.comment}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={() => deleteComment(comment.id, comment.user_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
