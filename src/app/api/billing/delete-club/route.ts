import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const { clubId } = body as { clubId: string };

  if (!clubId) {
    return NextResponse.json({ error: "Missing clubId" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a club organiser" }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from("clubs")
    .delete()
    .eq("id", clubId);

  if (deleteError) {
    console.error("Delete club error:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete club", details: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
