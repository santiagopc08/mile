import { MinimalApp } from './Application.js';

export function runMinimalApp() {
  const app = new MinimalApp();
  app.initialize();

  // Simulate 10 frames of execution
  for (let frame = 0; frame < 10; frame++) {
    // Simulate keyboard direction changes
    if (frame === 2) app.handleInput(1, 0); // Move Right
    if (frame === 6) app.handleInput(0, 1); // Move Down

    app.tick(0.016);
  }

  app.stop();
  return app;
}
