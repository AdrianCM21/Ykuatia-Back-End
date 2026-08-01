type PdfDoc = {
  getBuffer: (cb: (buffer: Buffer) => void) => void;
};

export const pdfToBuffer = (pdfDoc: PdfDoc): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    try {
      pdfDoc.getBuffer((buffer) => {
        if (!buffer || !buffer.length) {
          reject(new Error('PDF vacío'));
          return;
        }
        const out = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
        if (out.slice(0, 4).toString() !== '%PDF') {
          reject(new Error('El documento generado no es un PDF válido'));
          return;
        }
        resolve(out);
      });
    } catch (error) {
      reject(error);
    }
  });
