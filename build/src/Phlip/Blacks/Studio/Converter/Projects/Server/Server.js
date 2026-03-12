const express = require('express');
const multer = require('multer');
const { convert } = require('libreoffice-convert');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for frontend communication
app.use(cors({
  origin: 'http://localhost:3000', // Adjust to match your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.static('public'));

app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join('uploads', `${req.file.filename}.pdf`);

    const docBuf = await fs.readFile(inputPath);
    convert(docBuf, '.pdf', undefined, (err, pdfBuf) => {
      if (err) {
        console.error('Conversion error:', err);
        return res.status(500).json({ error: 'Conversion failed' });
      }

      // Save PDF temporarily and send to client
      fs.writeFile(outputPath, pdfBuf)
        .then(() => {
          res.download(outputPath, `${req.file.originalname.replace(/\.[^/.]+$/, '')}.pdf`, async (err) => {
            if (err) {
              console.error('Download error:', err);
              res.status(500).json({ error: 'Failed to send PDF' });
            }
            // Clean up files
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});
          });
        })
        .catch((err) => {
          console.error('Write error:', err);
          res.status(500).json({ error: 'Failed to save PDF' });
        });
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error during conversion' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));