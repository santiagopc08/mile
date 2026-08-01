export class PipelineStage {
  async execute(context) {
    throw new Error('PipelineStage.execute() must be implemented.');
  }
}
