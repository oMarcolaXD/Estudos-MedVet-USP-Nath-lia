export async function extrairTextoPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const paginas: string[] = [];
  const limite = Math.min(pdf.numPages, 30);

  for (let i = 1; i <= limite; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const texto = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (texto) paginas.push(texto);
  }

  return paginas.join('\n\n');
}
