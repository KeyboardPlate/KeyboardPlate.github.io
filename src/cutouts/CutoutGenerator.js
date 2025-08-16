export class CutoutGenerator {
  constructor() {
    if (this.constructor === CutoutGenerator) {
      throw new Error("Abstract CutoutSwitch was attempted to be instantiated.");
    }
  }
  generate(key, generatorOptions) {
    throw new Error("Method generate() must be implemented.");
  }
}