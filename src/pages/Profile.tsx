import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserCircle } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "System Admin", avd: "AVD", department_head: "Department Head",
  ara: "ARA", supervisor: "Supervisor", technician: "Technician",
  instructor: "Instructor", student: "Student", management: "Management",
};

export default function Profile() {
  const { profile, role, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Profile updated" });
      await refreshProfile();
    }
  };

  const handlePasswordChange = async () => {
    const newPw = prompt("Enter new password (min 6 characters):");
    if (!newPw || newPw.length < 6) {
      if (newPw) toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Password changed" });
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">View and update your profile information</p>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <UserCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{profile.full_name || "—"}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground uppercase">{ROLE_LABELS[role ?? ""] ?? role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 ..." />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email ?? ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
          <Button variant="outline" onClick={handlePasswordChange}>Change Password</Button>
        </div>
      </div>
    </div>
  );
}
