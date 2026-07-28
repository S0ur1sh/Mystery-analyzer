/* ==========================================================================
   MYSTERY ANALYZER // PDF EXTRACTION ENGINE
   ========================================================================== */

(function () {

    'use strict';


    async function extractPdfText(file) {

        if (!window.pdfjsLib) {
            throw new Error("PDF.js library not loaded");
        }


        const buffer = await file.arrayBuffer();


        const pdf = await window.pdfjsLib
            .getDocument({
                data: buffer
            })
            .promise;


        let output = "";


        for (let i = 1; i <= pdf.numPages; i++) {

            const page = await pdf.getPage(i);

            const content =
                await page.getTextContent();


            const text =
                content.items
                .map(item => item.str)
                .join(" ")
                .trim();


            if (text) {
                output +=
                    "--- PAGE " + i + " ---\n" +
                    text +
                    "\n\n";
            }

        }


        if (!output.trim()) {
            throw new Error(
                "No selectable text found in PDF"
            );
        }


        return output.trim();

    }



    window.extractFileText = async function (file) {


        if (!file) {
            throw new Error(
                "No file selected"
            );
        }


        if (
            file.name.toLowerCase().endsWith(".pdf")
        ) {

            return await extractPdfText(file);

        }


        return await file.text();


    };



    console.log(
        "[PDF ENGINE] extractFileText loaded"
    );


})();
