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

  const { error: rpcError } = await supabase.rpc("downgrade_club_to_free", {
    p_club_id: clubId,
    p_user_id: user.id,
  });

  if (rpcError) {
    console.error("Downgrade RPC Error:", rpcError);
    return NextResponse.json(
      { error: "Downgrade failed", details: rpcError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
