import { DomainCapability } from './SandboxEvents.js';

export class CapabilityDescriptor {
  constructor(domain, name, enabled = true) {
    this.domain = domain;
    this.name = name;
    this.enabled = enabled;
    this.version = '1.0.0';
    this.metrics = { activeSystems: 0, executionTimeMs: 0 };
  }
}

/**
 * CapabilityRegistry — manages dynamic composition, enablement, and configuration of SDK domains.
 */
export class CapabilityRegistry {
  constructor() {
    this.capabilities = new Map();
    this._initializeDefaultCapabilities();
  }

  _initializeDefaultCapabilities() {
    const domains = Object.values(DomainCapability);
    for (const domain of domains) {
      this.capabilities.set(domain, new CapabilityDescriptor(domain, `${domain}_Domain`, true));
    }
  }

  enable(domain) {
    const cap = this.capabilities.get(domain);
    if (cap) {
      cap.enabled = true;
    } else {
      this.capabilities.set(domain, new CapabilityDescriptor(domain, `${domain}_Domain`, true));
    }
  }

  disable(domain) {
    const cap = this.capabilities.get(domain);
    if (cap) {
      cap.enabled = false;
    }
  }

  isEnabled(domain) {
    const cap = this.capabilities.get(domain);
    return cap ? cap.enabled : false;
  }

  getActiveCapabilities() {
    return Array.from(this.capabilities.values()).filter((c) => c.enabled);
  }

  getAllCapabilities() {
    return Array.from(this.capabilities.values());
  }
}
