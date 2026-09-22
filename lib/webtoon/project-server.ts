import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { BUILT_IN_PROJECT_ID, framesDocId, labelledFrames, projectDocId, projectScript, type ProjectFrame, type StudioProject } from "@/lib/webtoon/project";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { STUDIO_SCREENPLAY, studioFilmFramesDense } from "@/lib/webtoon/studio-assets";
import type { StudioIdentity } from "@/lib/webtoon/studio-server";
import type { WebtoonScript } from "@/lib/webtoon/types";

/**
 * What a route needs to work on a project: its script (style, palettes,
 * anchors), the frames of its film (one per second), its screenplay, and
 * whether it is Lost Garden, whose writer and supervisor carry rules of
 * their own (the helmet of Lanterne, the places of the series).
 */
export type ProjectContext = {
  script: WebtoonScript;
  frames: { src: string; seconds: number; label: string }[];
  screenplay: string;
  lostGarden: boolean;
  project: StudioProject | null;
};

async function readLibraryDoc(docId: string, idToken: string): Promise<Record<string, { stringValue?: string }> | null> {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!project) return null;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/webtoon_library/${encodeURIComponent(docId)}`,
    { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" },
  );
  if (!response.ok) return null;
  const json = (await response.json()) as { fields?: Record<string, { stringValue?: string }> };
  return json.fields ?? null;
}

/** The project a route works on, or null when the slug is neither Lost Garden nor a project this account can read. */
export async function getProjectContext(slug: string, identity: StudioIdentity): Promise<ProjectContext | null> {
  const builtIn = getWebtoonScript(slug);
  if (builtIn) {
    return {
      script: builtIn,
      frames: studioFilmFramesDense(),
      screenplay: slug === BUILT_IN_PROJECT_ID ? STUDIO_SCREENPLAY.pages.map((page) => `[page ${page.page}]\n${page.text}`).join("\n\n") : "",
      lostGarden: true,
      project: null,
    };
  }
  if (!identity.idToken) return null;
  const [projectFields, framesFields] = await Promise.all([readLibraryDoc(projectDocId(slug), identity.idToken), readLibraryDoc(framesDocId(slug), identity.idToken)]);
  if (!projectFields?.project_json?.stringValue) return null;
  let project: StudioProject;
  try {
    project = JSON.parse(projectFields.project_json.stringValue) as StudioProject;
  } catch {
    return null;
  }
  let frames: ProjectFrame[] = [];
  try {
    frames = JSON.parse(framesFields?.frames_json?.stringValue ?? "[]") as ProjectFrame[];
  } catch {
    frames = [];
  }
  return {
    script: projectScript(project),
    frames: labelledFrames([...frames].sort((a, b) => a.seconds - b.seconds)),
    screenplay: project.screenplay ?? "",
    lostGarden: false,
    project,
  };
}

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

/** An image as a data URL: a file of the site (`/webtoon/...`) or a Storage URL of a project. */
export async function imageAsDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  if (/^https?:\/\//.test(src)) {
    const response = await fetch(src, { cache: "no-store" });
    if (!response.ok) throw new Error(`image ${response.status}: ${src.slice(0, 80)}`);
    const type = response.headers.get("content-type") ?? "image/jpeg";
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${type};base64,${bytes.toString("base64")}`;
  }
  const file = path.join(process.cwd(), "public", src);
  const bytes = await readFile(file);
  return `data:${MIME[path.extname(file).toLowerCase()] ?? "image/jpeg"};base64,${bytes.toString("base64")}`;
}
