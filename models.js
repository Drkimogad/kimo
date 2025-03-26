// Model Loader with Cache Validation
const MODEL_STATES = {
    NOT_LOADED: 0,
    LOADING: 1,
    LOADED: 2,
    ERROR: 3
};

const modelRegistry = {
    mobilenet: { state: MODEL_STATES.NOT_LOADED, instance: null },
    sentenceEncoder: { state: MODEL_STATES.NOT_LOADED, instance: null },
    tesseract: { state: MODEL_STATES.NOT_LOADED, worker: null },
    summarizer: { state: MODEL_STATES.NOT_LOADED },
    personalizer: { state: MODEL_STATES.NOT_LOADED }
};

// Progressive Loading with Retries
async function loadWithRetry(loader, modelName, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const model = await loader();
            modelRegistry[modelName].state = MODEL_STATES.LOADED;
            modelRegistry[modelName].instance = model;
            updateLoadingProgress();
            return model;
        } catch (error) {
            if (i === retries - 1) {
                modelRegistry[modelName].state = MODEL_STATES.ERROR;
                throw new Error(`${modelName} load failed: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Unified Model Loader
export async function loadModels() {
    try {
        // Load Core TF first
        await loadWithRetry(() => import('/model-cache/tf.js'), 'tfjs');
        
        // Parallel load base models
        await Promise.all([
            loadWithRetry(() => import('/model-cache/mobilenet.js').then(m => m.load()), 'mobilenet'),
            loadWithRetry(() => import('/model-cache/universal-sentence-encoder.js').then(m => m.load()), 'sentenceEncoder'),
            loadWithRetry(() => import('/model-cache/tesseract.js').then(m => m.createWorker()), 'tesseract')
        ]);
        
        // Load custom models
        modelRegistry.summarizer.state = MODEL_STATES.LOADED;
        modelRegistry.personalizer.state = MODEL_STATES.LOADED;
        
    } catch (error) {
        console.error('Critical load failure:', error);
        showGlobalError('AI engine failed to initialize. Please refresh.');
    }
}

// Handwriting Recognition with Fallback
export async function recognizeHandwriting(image) {
    if (modelRegistry.tesseract.state !== MODEL_STATES.LOADED) {
        throw new Error('OCR engine not ready');
    }
    
    try {
        await modelRegistry.tesseract.worker.loadLanguage('eng');
        await modelRegistry.tesseract.worker.initialize('eng');
        const { data: { text } } = await modelRegistry.tesseract.worker.recognize(image);
        return text.replace(/\n/g, ' ').trim();
    } catch (error) {
        if (navigator.onLine) {
            throw new Error('Text recognition failed. Try clearer image.');
        } else {
            throw new Error('OCR requires internet connection');
        }
    }
}

// Progress Updates
function updateLoadingProgress() {
    const loaded = Object.values(modelRegistry).filter(m => m.state === MODEL_STATES.LOADED).length;
    const total = Object.keys(modelRegistry).length;
    const progress = document.querySelector('.model-load-progress');
    if (progress) {
        progress.value = Math.floor((loaded / total) * 100);
    }
}
