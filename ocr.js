const Tesseract = window.Tesseract; // import function

export const recognizeHandwriting = (imageSource) => {
  // Check if the image source is a canvas or an image URL
  let imagePath = imageSource;

  // If it's a canvas, convert it to a data URL first
  if (imageSource instanceof HTMLCanvasElement) {
    imagePath = imageSource.toDataURL('image/png'); // Convert canvas to base64 string
  }

  Tesseract.recognize(
    imagePath,
    'eng', // Language (English in this case)
    {
      logger: (m) => console.log(m), // Log progress
    }
  ).then(({ data: { text } }) => {
    console.log('Recognized Text:', text); // Output recognized text
    // Here you can update the UI or pass the text back
  }).catch(err => {
    console.error('Error:', err); // Handle errors
  });
};

// Wrap Tesseract usage inside an event listener
window.addEventListener('load', () => {
    console.log("Window loaded. Checking Tesseract...");
    console.log(window.Tesseract);  // Should print an object if loaded correctly
});
