import { ServiceRegistry } from './services/ServiceRegistry.js';
import { Configuration } from './config/Configuration.js';
import { Logger } from './logging/Logger.js';
import { FeatureFlags } from './config/FeatureFlags.js';
import { Environment } from './config/Environment.js';
import { Lifecycle, LifecycleState } from './lifecycle/Lifecycle.js';

export class CoreContext {
  constructor(options = {}) {
    this.id = options.id || 'core_context';
    this.logger = new Logger(this.id);
    this.config = new Configuration(options.config || {});
    this.services = new ServiceRegistry();
    this.featureFlags = new FeatureFlags();
    this.environment = new Environment(options.env);
    this.lifecycle = new Lifecycle();

    this.lifecycle.transitionTo(LifecycleState.INITIALIZED);
  }

  dispose() {
    this.lifecycle.transitionTo(LifecycleState.DISPOSED);
    this.services.dispose();
    this.logger.info(`CoreContext [${this.id}] disposed successfully.`);
  }
}
