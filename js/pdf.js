/* Shared PDF and text-file extraction helper. */
(function () {
    'use strict';

    async function extractPdfText(file) {
        if (typeof window.pdfjsLib === 'undefined') {
            throw new Error('The PDF reader is not available. Refresh the page and try again.');
        }

        const documentTask = window.pdfjsLib.getDocument({ data: await file.arrayBuffer() });
        const pdf = await documentTask.promise;
        const pages = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            const text = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
            if (text) pages.push(`--- PAGE ${pageNumber} ---\n${text}`);
        }

        const result = pages.join('\n\n').trim();
        if (!result) {
            throw new Error('This PDF has no selectable text. Scanned PDFs need OCR support.');
        }
        return result;
    }

    window.extractFileText = async function extractFileText(file) {
        if (!file) throw new Error('No file was selected.');
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            return extractPdfText(file);
        }
        return (await file.text()).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    };
}());
