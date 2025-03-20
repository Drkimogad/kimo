import Tesseract from 'tesseract.js';

export const recognizeHandwriting = (imagePath) => {
  Tesseract.recognize(
    imagePath,
    'eng',
    {
      logger: (m) => console.log(m) // Log progress
    }
  ).then(({ data: { text } }) => {
    console.log(text); // Output recognized text
  }).catch(err => {
    console.error(err); // Handle errors
  });
};
