import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "../../data");

export async function GET() {
    const files = await fs.readdir(DATA_DIR);
    const kgFiles = files.filter((f) => f.endsWith(".kg.json"));

    const graphs = await Promise.all(
        kgFiles.map(async (filename) => {
            const content = await fs.readFile(
                path.join(DATA_DIR, filename),
                "utf-8",
            );
            const parsed = JSON.parse(content);
            return {
                filename,
                name: parsed.metadata.name,
                nodeCount: parsed.nodes.length,
                tripleCount: parsed.triples.length,
                ruleCount: parsed.rules?.length ?? 0,
            };
        }),
    );

    return NextResponse.json(graphs);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { name } = body;

    if (!name) {
        return NextResponse.json(
            { error: "name is required" },
            { status: 400 },
        );
    }

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "-")
        .replace(/-+/g, "-");
    const filename = `${slug}.kg.json`;
    const filepath = path.join(DATA_DIR, filename);

    const now = new Date().toISOString().split("T")[0];
    const graph = {
        metadata: { name, created: now, updated: now },
        nodes: [],
        triples: [],
        rules: [],
    };

    await fs.writeFile(filepath, JSON.stringify(graph, null, 2));

    return NextResponse.json({ filename, name }, { status: 201 });
}
