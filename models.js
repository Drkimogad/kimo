// models.js - Keep this version
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { recognizeHandwriting } from './handwritingModel.js';

// Shared model instances
export let textModel, imageModel;

// Model initialization
export async function loadModels() {
  try {
    // Load MobileNet
    imageModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    
    // Load Universal Sentence Encoder
    textModel = await use.load();
    
    // Initialize handwriting model
    await recognizeHandwriting.init();
    
    console.log('All models loaded');
  } catch (error) {
    console.error('Model loading failed:', error);
    throw error; // Throw to handle in script.js
  }
}
