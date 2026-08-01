export class ResourceHandle {
  constructor(descriptor, nativeHandle = null) {
    this.descriptor = descriptor;
    this.nativeHandle = nativeHandle;
    this.urn = descriptor ? descriptor.urn : '';
    this.isValid = true;
  }
}
