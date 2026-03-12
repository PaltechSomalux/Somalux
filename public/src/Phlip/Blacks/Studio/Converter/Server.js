const fastify = require('fastify')({ logger: true });
const { Converter } = require('pdf2docx');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure file upload handling
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch((err) => {
  fastify.log.error(`Failed to create uploads directory: ${err.message}`);
});

// Conversion endpoint
fastify.post('/convert-pdf-to-word', async (request, reply) => {
  try {
    // Get the uploaded file
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded' });
    }
    if (data.mimetype !== 'application/pdf') {
      return reply.status(400).send({ message: 'Invalid file type. Only PDF files are accepted' });
    }

    // Save the uploaded PDF
    const pdfFileName = `${uuidv4()}-${data.filename}`;
    const pdfPath = path.join(uploadsDir, pdfFileName);
    const fileStream = data.file;
    await fs.writeFile(pdfPath, await data.toBuffer());

    // Convert PDF to Word
    const docxFileName = pdfFileName.replace(/\.pdf$/i, '.docx');
    const docxPath = path.join(UploadsDir, docxFileName);
    const converter = new Converter(pdfPath);
    await converter.convert(docxPath);

    // Read the converted DOCX file
    const docxBuffer = await fs.readFile(docxPath);

    // Clean up temporary files
    await Promise.all([
      fs.unlink(pdfPath).catch((err) => fastify.log.warn(`Failed to delete PDF: ${err.message}`)),
      fs.unlink(docxPath).catch((err) => fastify.log.warn(`Failed to delete DOCX: ${err.message}`)),
    ]);

    // Send the DOCX file
    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .header('Content-Disposition', `attachment; filename="${docxFileName}"`)
      .send(docxBuffer);
  } catch (err) {
    fastify.log.error(`Conversion error: ${err.message}`);
    reply.status(500).send({ message: `Conversion failed: ${err.message}` });
  }
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 8000, host: '0.0.0.0' });
    fastify.log.info('Server running on http://localhost:8000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();