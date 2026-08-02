import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const platformRoot = path.join(process.cwd(), 'platform');
const debugBin = path.join(platformRoot, 'build', 'debug', 'bin');

const commands = {
  hillClimb: path.join(debugBin, 'hill_climb'),
  editor: path.join(debugBin, 'editor'),
  arcade: path.join(debugBin, 'arcade'),
  tests: path.join(debugBin, 'platform_tests'),
} as const;

type Action = keyof typeof commands;

const ACTIONS = Object.keys(commands) as Action[];

function isAction(value: unknown): value is Action {
  return typeof value === 'string' && (ACTIONS as string[]).includes(value);
}

const WINDOW_LABELS: Record<Action, string> = {
  hillClimb: 'Hill Climb Native',
  editor: 'Editor de Escenas',
  arcade: 'ORBIT Arcade',
  tests: 'Validation Lab',
};

export async function POST(request: Request) {
  let body: { action?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (!isAction(body.action)) {
    return NextResponse.json({ error: 'Acción C++ no permitida.' }, { status: 400 });
  }

  const executable = commands[body.action];
  if (!existsSync(executable)) {
    return NextResponse.json(
      { error: `No se encontró el binario ${path.basename(executable)}. Ejecuta el build Debug de platform.` },
      { status: 404 },
    );
  }

  if (body.action !== 'tests') {
    const child = spawn(executable, [], {
      cwd: platformRoot,
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    return NextResponse.json({ ok: true, pid: child.pid, action: body.action, window: WINDOW_LABELS[body.action] });
  }

  const testFilter = '[PhysicsScene],[VehicleScene],[TerrainScene],[GameplayScene],[ProgressionScene],[PresentationScene],[AudioScene],[AssetScene],[ContentScene]';

  return new Promise<Response>((resolve) => {
    const child = spawn(executable, [testFilter, '-r', 'compact'], {
      cwd: platformRoot,
      env: { ...process.env, SDL_AUDIODRIVER: 'dummy' },
    });
    let output = '';

    const append = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 24000) output = output.slice(-24000);
    };

    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.on('error', (error) => {
      resolve(NextResponse.json({ ok: false, error: error.message, output }, { status: 500 }));
    });
    child.on('close', (code) => {
      resolve(NextResponse.json({ ok: code === 0, exitCode: code, output }));
    });
  });
}
