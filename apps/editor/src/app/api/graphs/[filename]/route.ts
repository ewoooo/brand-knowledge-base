import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "../../data");

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename } = await params;
    const filepath = path.join(DATA_DIR, filename);

    try {
        const content = await fs.readFile(filepath, "utf-8");
        return NextResponse.json(JSON.parse(content));
    } catch {
        return NextResponse.json({ error: "Graph not found" }, { status: 404 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename } = await params;
    const filepath = path.join(DATA_DIR, filename);
    const graph = await request.json();

    graph.metadata.updated = new Date().toISOString().split("T")[0];

    await fs.writeFile(filepath, JSON.stringify(graph, null, 2));

    return NextResponse.json({ success: true });
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename } = await params;
    const filepath = path.join(DATA_DIR, filename);

    try {
        await fs.unlink(filepath);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Graph not found" }, { status: 404 });
    }
}
