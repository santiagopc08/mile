export const PermissionType = Object.freeze({
  FILESYSTEM: 'FILESYSTEM',
  STORAGE: 'STORAGE',
  INPUT: 'INPUT',
  AUDIO: 'AUDIO',
  DEBUG: 'DEBUG',
  CUSTOM: 'CUSTOM',
});

export class Permission {
  constructor(type, granted = false) {
    this.type = type;
    this.granted = granted;
  }
}

export class PermissionSet {
  constructor(permissions = []) {
    this.permissions = new Map();
    permissions.forEach((p) => this.permissions.set(p.type, p));
  }

  grant(type) {
    this.permissions.set(type, new Permission(type, true));
  }

  has(type) {
    const perm = this.permissions.get(type);
    return perm ? perm.granted : false;
  }
}

export class PermissionResolver {
  static resolve(app, permissionType) {
    return app.permissionSet ? app.permissionSet.has(permissionType) : false;
  }
}
