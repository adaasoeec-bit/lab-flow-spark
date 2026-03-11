import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check if any admin already exists
    const { data: existingRoles } = await adminClient
      .from("user_roles")
      .select("*")
      .eq("role", "admin");

    if (existingRoles && existingRoles.length > 0) {
      return new Response(
        JSON.stringify({ message: "Admin already exists", user_id: existingRoles[0].user_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: newUser, error } = await adminClient.auth.admin.createUser({
      email: "mesfen.megra@astu.edu.et",
      password: "12345678",
      email_confirm: true,
      user_metadata: { full_name: "System Administrator" },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Wait for trigger to create profile + default role
    await new Promise((r) => setTimeout(r, 1000));

    // Update profile
    await adminClient
      .from("profiles")
      .update({
        full_name: "System Administrator",
        email: "mesfen.megra@astu.edu.et",
        password_change_required: false,
      })
      .eq("id", newUser.user!.id);

    // Promote to admin
    await adminClient
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", newUser.user!.id);

    return new Response(
      JSON.stringify({ message: "Admin created successfully", user_id: newUser.user!.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
