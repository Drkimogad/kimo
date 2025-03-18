// models/image-model.js
import * as mobilenet from '@tensorflow-models/mobilenet';

let model;

export default {
  async init() {
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
  },
  
  async classify(imageElement) {
    if (!model) await this.init();
    return model.classify(imageElement);
  }
};
