import { PipelineStage } from './PipelineStage.js';

export class RegistrationStage extends PipelineStage {
  async execute(context) {
    if (context.descriptor) {
      context.descriptor.state = 'LOADED';
    }
    context.registered = true;
    return context;
  }
}
