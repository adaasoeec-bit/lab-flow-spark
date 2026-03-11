import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    // Verify caller identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await userClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check caller role
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();
    const role = callerRole?.role;
    if (!role || !["admin", "avd", "department_head"].includes(role)) {
      return json({ error: "Forbidden — insufficient role" }, 403);
    }

    const body = await req.json();
    const { action } = body;

    // ── CREATE USER ──
    if (action === "create_user") {
      const { email, full_name, user_role, department_id } = body;
      const defaultPassword = body.password || "12345678";

      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (error) return json({ error: error.message }, 400);

      // Wait for trigger to create profile
      await new Promise((r) => setTimeout(r, 800));

      await adminClient
        .from("profiles")
        .update({ full_name, email, department_id, password_change_required: true })
        .eq("id", newUser.user!.id);

      if (user_role && user_role !== "student") {
        await adminClient
          .from("user_roles")
          .update({ role: user_role })
          .eq("user_id", newUser.user!.id);
      }

      return json({ user_id: newUser.user!.id, message: "User created" });
    }

    // ── DELETE USER ──
    if (action === "delete_user") {
      if (role !== "admin") return json({ error: "Only admin can delete users" }, 403);
      const { user_id } = body;
      if (user_id === caller.id) return json({ error: "Cannot delete yourself" }, 400);
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: "User deleted" });
    }

    // ── RESET PASSWORD ──
    if (action === "reset_password") {
      if (role !== "admin") return json({ error: "Only admin can reset passwords" }, 403);
      const { user_id, new_password } = body;
      const pw = new_password || "12345678";
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: pw });
      if (error) return json({ error: error.message }, 400);
      await adminClient.from("profiles").update({ password_change_required: true }).eq("id", user_id);
      return json({ message: "Password reset to default" });
    }

    // ── UPDATE ROLE ──
    if (action === "update_role") {
      const { user_id, new_role } = body;
      const { error } = await adminClient
        .from("user_roles")
        .update({ role: new_role })
        .eq("user_id", user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: "Role updated" });
    }

    // ── UPDATE USER ──
    if (action === "update_user") {
      const { user_id, full_name, email, department_id, phone } = body;
      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (email !== undefined) updates.email = email;
      if (department_id !== undefined) updates.department_id = department_id;
      if (phone !== undefined) updates.phone = phone;
      const { error } = await adminClient.from("profiles").update(updates).eq("id", user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: "User updated" });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
