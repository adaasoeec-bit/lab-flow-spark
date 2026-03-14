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

    // Check caller permissions using the user_has_permission function
    const hasPermission = async (permCode: string) => {
      const { data } = await adminClient.rpc("user_has_permission", {
        _user_id: caller.id,
        _permission_code: permCode,
      });
      return data === true;
    };

    const body = await req.json();
    const { action } = body;

    // ── CREATE USER ──
    if (action === "create_user") {
      if (!(await hasPermission("users.create"))) return json({ error: "Forbidden" }, 403);

      const { email, full_name, role_id, department_id, scope, scope_id } = body;
      const defaultPassword = body.password || "12345678";

      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (error) return json({ error: error.message }, 400);

      // Wait for trigger to create profile + default role assignment
      await new Promise((r) => setTimeout(r, 800));

      // Update profile
      await adminClient
        .from("profiles")
        .update({ full_name, email, department_id: department_id || null, password_change_required: true })
        .eq("id", newUser.user!.id);

      // Update role assignment if role_id provided
      if (role_id) {
        await adminClient
          .from("user_role_assignments")
          .upsert({
            user_id: newUser.user!.id,
            role_id,
            scope: scope || "department",
            scope_id: scope_id || null,
          }, { onConflict: "user_id" });

        // Check if this is the Super Admin role, update legacy table too
        const { data: roleData } = await adminClient
          .from("custom_roles")
          .select("name")
          .eq("id", role_id)
          .single();
        if (roleData?.name === "Super Admin") {
          await adminClient
            .from("user_roles")
            .update({ role: "admin" })
            .eq("user_id", newUser.user!.id);
        }
      }

      return json({ user_id: newUser.user!.id, message: "User created" });
    }

    // ── DELETE USER ──
    if (action === "delete_user") {
      if (!(await hasPermission("users.delete"))) return json({ error: "Forbidden" }, 403);
      const { user_id } = body;
      if (user_id === caller.id) return json({ error: "Cannot delete yourself" }, 400);
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: "User deleted" });
    }

    // ── RESET PASSWORD ──
    if (action === "reset_password") {
      if (!(await hasPermission("users.reset_password"))) return json({ error: "Forbidden" }, 403);
      const { user_id, new_password } = body;
      const pw = new_password || "12345678";
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: pw });
      if (error) return json({ error: error.message }, 400);
      await adminClient.from("profiles").update({ password_change_required: true }).eq("id", user_id);
      return json({ message: "Password reset to default" });
    }

    // ── UPDATE USER FULL (profile + role + scope) ──
    if (action === "update_user_full") {
      if (!(await hasPermission("users.edit"))) return json({ error: "Forbidden" }, 403);
      const { user_id, full_name, department_id, role_id, scope, scope_id } = body;

      // Update profile
      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (department_id !== undefined) updates.department_id = department_id;
      if (Object.keys(updates).length > 0) {
        await adminClient.from("profiles").update(updates).eq("id", user_id);
      }

      // Update role assignment
      if (role_id) {
        await adminClient
          .from("user_role_assignments")
          .upsert({
            user_id,
            role_id,
            scope: scope || "department",
            scope_id: scope_id || null,
          }, { onConflict: "user_id" });

        // Sync legacy table for admin
        const { data: roleData } = await adminClient
          .from("custom_roles")
          .select("name")
          .eq("id", role_id)
          .single();
        const legacyRole = roleData?.name === "Super Admin" ? "admin" : "student";
        await adminClient
          .from("user_roles")
          .update({ role: legacyRole })
          .eq("user_id", user_id);
      }

      return json({ message: "User updated" });
    }

    // ── UPDATE ROLE (legacy compat) ──
    if (action === "update_role") {
      if (!(await hasPermission("users.edit"))) return json({ error: "Forbidden" }, 403);
      const { user_id, new_role } = body;
      const { error } = await adminClient
        .from("user_roles")
        .update({ role: new_role })
        .eq("user_id", user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ message: "Role updated" });
    }

    // ── UPDATE USER (legacy compat) ──
    if (action === "update_user") {
      if (!(await hasPermission("users.edit"))) return json({ error: "Forbidden" }, 403);
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
