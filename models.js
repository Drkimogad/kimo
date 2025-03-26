// Model State Management
const MODEL_STATES = {
    NOT_LOADED: 0,
    LOADING: 1,
    LOADED: 2,
    ERROR: 3
};

const modelRegistry = {
    tf: { state: MODEL_STATES.NOT_LOADED, instance: null },
    mobilenet: { state: MODEL_STATES.NOT_LOADED, instance: null },
    tesseract: { state: MODEL_STATES.NOT_LOADED, worker: null },
    isReady: false
};

// Progress Tracking
let totalModels = Object.keys(modelRegistry).length - 1; // Exclude isReady
let loadedModels = 0;

// Unified Loader with Retries
async function loadWithRetry(loader, modelName, retries = 3) {
    modelRegistry[modelName].state = MODEL_STATES.LOADING;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await loader();
            modelRegistry[modelName].instance = result;
            modelRegistry[modelName].state = MODEL_STATES.LOADED;
            loadedModels++;
            updateProgress();
            return result;
        } catch (error) {
            if (attempt === retries) {
                modelRegistry[modelName].state = MODEL_STATES.ERROR;
                throw new Error(`${modelName} failed after ${retries} attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// Main Load Function
export async function loadModels() {
    try {
        // 1. Load TensorFlow Core
        await loadWithRetry(
            () => import('/model-cache/tf.js'),
            'tf'
        );

        // 2. Load Other Models in Parallel
        await Promise.all([
            loadWithRetry(
                () => import('/model-cache/mobilenet.js').then(m => m.load()),
                'mobilenet'
            ),
            loadWithRetry(
                () => import('/model-cache/tesseract.js')
                    .then(Tesseract => Tesseract.createWorker()
                        .then(worker => {
                            return worker.loadLanguage('eng')
                                .then(() => worker.initialize('eng'))
                                .then(() => worker);
                        }),
                'tesseract'
            )
        ]);

        modelRegistry.isReady = true;
        return true;
    } catch (error) {
        console.error('Model loading failed:', error);
        showGlobalError('AI engine initialization failed. Please refresh.');
        return false;
    }
}

// Handwriting Recognition
export async function recognizeHandwriting(image) {
    if (!modelRegistry.isReady) {
        throw new Error('Models not fully loaded');
    }

    try {
        const { data: { text } } = await modelRegistry.tesseract.worker.recognize(image);
        return {
            raw: text,
            cleaned: text.replace(/\n+/g, ' ').trim()
        };
    } catch (error) {
        if (!navigator.onLine) {
            throw new Error('OCR requires internet connection for language data');
        }
        throw new Error(`Recognition failed: ${error.message}`);
    }
}

// Progress Updates
function updateProgress() {
    const progress = document.querySelector('.model-load-progress');
    if (progress) {
        progress.value = Math.floor((loadedModels / totalModels) * 100);
    }
}

// Global Error Handler
function showGlobalError(message) {
    const errorContainer = document.getElementById('global-error');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
        errorContainer.style.display = 'block';
    }
}

// Public API
export function isModelReady() {
    return modelRegistry.isReady;
}

export function getModel(modelName) {
    if (!modelRegistry.isReady) {
        throw new Error(`Models not loaded. Current state: ${modelRegistry[modelName].state}`);
    }
    return modelRegistry[modelName].instance;
}
