import { NextResponse } from "next/server";

// Endpoint simple para verificar la clave maestra sin realizar ninguna acción
export async function POST(req: Request) {
  try {
    const { clave } = await req.json();
    if (!clave) {
      return NextResponse.json({ error: "Clave requerida." }, { status: 400 });
    }
    if (clave !== process.env.CLAVE_MAESTRA) {
      return NextResponse.json({ error: "Clave maestra incorrecta." }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
