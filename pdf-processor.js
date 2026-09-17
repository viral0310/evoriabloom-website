/**
 * EvoriaBloom - Advanced Client-Side PDF Label Processor
 * 
 * Powered by pdfjs-dist (for deep text and layout parsing)
 * and pdf-lib (for lossless page manipulation, cropping, stamping & assembly)
 */

window.EvoriaPDF = (function () {
  // Ensure pdf.js worker is properly configured
  try {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
    }
  } catch (e) {
    console.warn('Worker configuration note:', e);
  }

  // Courier partner known patterns
  const COURIER_PATTERNS = [
    { name: 'Delhivery', regex: /\b(delhivery)\b/i },
    { name: 'Shadowfax', regex: /\b(shadowfax)\b/i },
    { name: 'Xpressbees', regex: /\b(xpressbees|xpress\s*bees)\b/i },
    { name: 'Valmo', regex: /\b(valmo)\b/i },
    { name: 'Ecom Express', regex: /\b(ecom\s*express)\b/i },
    { name: 'DTDC', regex: /\b(dtdc)\b/i },
    { name: 'Smartr', regex: /\b(smartr)\b/i },
    { name: 'Bluedart', regex: /\b(bluedart|blue\s*dart)\b/i },
    { name: 'Ekart', regex: /\b(ekart|e-kart)\b/i },
    { name: 'Amazon ATS', regex: /\b(ats|amazon\s*shipping)\b/i }
  ];

  /**
   * Parse uploaded PDF files and extract orders/labels
   */
  async function parseFiles(files, platform, onProgress) {
    const orders = [];
    const sourceFiles = [];
    let totalPagesAcrossFiles = 0;

    // Step 1: Pre-load files
    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const file = files[fIdx];
      const arrayBuffer = await file.arrayBuffer();
      sourceFiles.push({
        id: fIdx,
        name: file.name,
        buffer: arrayBuffer
      });
    }

    if (onProgress) onProgress(0, sourceFiles.length, 'Analyzing PDF files...');

    // Step 2: Read each file with PDF.js
    for (let fIdx = 0; fIdx < sourceFiles.length; fIdx++) {
      const src = sourceFiles[fIdx];
      const typedArray = new Uint8Array(src.buffer.slice(0));
      const pdfDoc = await window.pdfjsLib.getDocument({
        data: typedArray,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      }).promise;
      const numPages = pdfDoc.numPages;
      totalPagesAcrossFiles += numPages;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (onProgress) {
          onProgress(
            orders.length + 1,
            totalPagesAcrossFiles,
            `Extracting page ${pageNum} of ${numPages} (${src.name})...`
          );
        }

        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // Advanced visual-layout text extraction
        const parsed = extractOrderDetailsAdvanced(textContent.items, platform, pageNum, viewport);

        // Detect if page is an Amazon invoice or packing slip
        const fullRawText = textContent.items.map(i => i.str).join(' ');
        const isInvoice = detectIfInvoicePage(fullRawText, platform);

        orders.push({
          id: `lbl_${fIdx}_${pageNum}_${Math.random().toString(36).substr(2, 6)}`,
          fileIndex: fIdx,
          fileName: src.name,
          pageNumber: pageNum,
          pageIndex: pageNum - 1,
          width: viewport.width,
          height: viewport.height,
          sku: parsed.sku,
          qty: parsed.qty,
          courier: parsed.courier,
          orderId: parsed.orderId,
          awb: parsed.awb,
          isInvoice: isInvoice,
          rawText: fullRawText
        });
      }
    }

    return {
      orders,
      sourceFiles
    };
  }

  /**
   * Detect if a page is solely an invoice/packing slip (used specifically for Amazon)
   */
  function detectIfInvoicePage(fullText, platform) {
    if (platform !== 'amazon') {
      return false;
    }
    const lower = fullText.toLowerCase();
    const hasInvoiceKeywords =
      lower.includes('tax invoice') ||
      lower.includes('tax invoice/bill of supply') ||
      lower.includes('invoice number') ||
      lower.includes('original for recipient') ||
      lower.includes('duplicate for transporter') ||
      lower.includes('sold by:') ||
      lower.includes('packing slip');

    const hasShippingBarcode =
      lower.includes('track your package') ||
      lower.includes('del-') ||
      lower.includes('bom-') ||
      lower.includes('ats') ||
      lower.includes('amazon shipping') ||
      lower.includes('ship to:');

    return hasInvoiceKeywords && !hasShippingBarcode;
  }

  /**
   * Advanced Visual Layout Parser
   * Groups text items into actual visual lines and table cells to accurately extract
   * SKU, Quantity, Courier, and Order ID even when PDF streams are disordered.
   */
  function extractOrderDetailsAdvanced(items, platform, pageNum, viewport) {
    const fullText = items.map(i => i.str).join(' ');
    let courier = 'Standard Express';
    let qty = 1;
    let orderId = `ORD-${pageNum}`;
    let awb = '';
    let sku = '';

    // 1. Courier Detection
    for (const cp of COURIER_PATTERNS) {
      if (cp.regex.test(fullText)) {
        courier = cp.name;
        break;
      }
    }

    // 2. Quantity Detection
    const qtyMatch = fullText.match(/(?:Qty|Quantity|QTY)\s*[:\-]?\s*(\d+)/i);
    if (qtyMatch && qtyMatch[1]) {
      qty = parseInt(qtyMatch[1], 10) || 1;
    }

    // 3. AWB Detection
    const awbMatch = fullText.match(/(?:AWB|Waybill|Tracking\s*No|Tracking\s*ID)\s*[:\-]?\s*([A-Za-z0-9]+)/i);
    if (awbMatch && awbMatch[1]) {
      awb = awbMatch[1].trim();
    }

    // 4. Order ID Detection
    if (platform === 'meesho') {
      const ordM = fullText.match(/(?:Sub\s*Order\s*No|Order\s*No|Order\s*ID)\s*[:\-]?\s*([0-9_\-]+)/i);
      if (ordM && ordM[1]) orderId = ordM[1].trim();
    } else if (platform === 'amazon') {
      const ordM = fullText.match(/\b\d{3}-\d{7}-\d{7}\b/);
      if (ordM) orderId = ordM[0];
    } else if (platform === 'flipkart') {
      const ordM = fullText.match(/\b(OD\d{16,20})\b/i);
      if (ordM) orderId = ordM[1];
    }

    // 5. Visual Line Construction for the Shipping Label Area
    // In standard labels, shipping label is at top (y >= viewport.height * 0.40)
    const labelItems = items.filter(it => it.transform && it.transform[5] >= (viewport.height * 0.38));

    // Sort items by Y descending (top to bottom), then X ascending (left to right)
    const sortedItems = [...labelItems].sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 3.5) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    // Group items into visual lines
    const lines = [];
    let curLine = [];
    let lastY = null;

    for (const it of sortedItems) {
      const text = (it.str || '').trim();
      if (!text) continue;
      const y = it.transform[5];

      if (lastY === null || Math.abs(lastY - y) <= 4) {
        curLine.push(it);
        lastY = y;
      } else {
        if (curLine.length > 0) lines.push(curLine);
        curLine = [it];
        lastY = y;
      }
    }
    if (curLine.length > 0) lines.push(curLine);

    // 6. Search for SKU in Visual Lines & Tables
    // Pattern A: Look for explicit "SKU: <value>" on the same line
    for (const line of lines) {
      const lineStr = line.map(i => i.str).join(' ');

      // E.g. "SKU: CHARWEE_114" or "SKU : avo nw 20" or "SKU - NEW PX EMIRATES 48"
      const explicitMatch = lineStr.match(/\bSKU\s*(?:Code|ID)?\s*[:\-]\s*(.+)/i);
      if (explicitMatch && explicitMatch[1]) {
        const cleaned = cleanCandidateSku(explicitMatch[1]);
        if (cleaned) {
          sku = cleaned;
          break;
        }
      }
    }

    // Pattern B: Table Column Detection
    // Often Meesho labels have a header row: [Product Name] [SKU] [Size] [Qty]
    // and the next row has: [<Product>] [<Actual_SKU>] [<Size>] [<Qty>]
    if (!sku) {
      for (let lIdx = 0; lIdx < lines.length - 1; lIdx++) {
        const line = lines[lIdx];
        const nextLine = lines[lIdx + 1];

        // Find if any item in this line is "SKU" or "SKU Code"
        const skuHeaderItem = line.find(it => /^\s*SKU\s*(?:Code|ID)?\s*$/i.test(it.str.trim()));
        if (skuHeaderItem) {
          const targetX = skuHeaderItem.transform[4];
          // Find the item in nextLine with closest X coordinate
          let closestItem = null;
          let minDiff = 50; // within 50 pt horizontally

          for (const nit of nextLine) {
            const diff = Math.abs(nit.transform[4] - targetX);
            if (diff < minDiff) {
              minDiff = diff;
              closestItem = nit;
            }
          }

          if (closestItem) {
            const cleaned = cleanCandidateSku(closestItem.str);
            if (cleaned) {
              sku = cleaned;
              break;
            }
          }
        }
      }
    }

    // Pattern C: Look for item following "SKU" in adjacent tokens
    if (!sku) {
      for (let i = 0; i < sortedItems.length; i++) {
        const token = sortedItems[i].str.trim();
        if (/^SKU\s*[:\-]?$/i.test(token)) {
          // Look ahead 1-3 items
          for (let j = i + 1; j < Math.min(i + 4, sortedItems.length); j++) {
            const candidate = cleanCandidateSku(sortedItems[j].str);
            if (candidate && !/^(Size|Qty|Quantity|Color|Colour|Free|Price|MRP)$/i.test(candidate)) {
              sku = candidate;
              break;
            }
          }
          if (sku) break;
        }
      }
    }

    // Pattern D: Regex for known seller SKU formats (letters, digits, dashes, underscores)
    if (!sku) {
      // Look for alphanumeric product identifiers (e.g. CHARWEE_114, NW_20, DNO-102)
      const matches = fullText.match(/\b([A-Za-z0-9]{2,15}[-_][A-Za-z0-9_\-]{2,20})\b/g);
      if (matches && matches.length > 0) {
        // Filter out system words
        const filtered = matches.filter(m => !/^(DELHIVERY|SHADOWFAX|XPRESSBEES|VALMO|EKART|ECOM|TRACKING|RETURN|ORDER|INVOICE)/i.test(m));
        if (filtered.length > 0) {
          sku = filtered[0].trim();
        }
      }
    }

    // Pattern E: Look for Product Name or Item Code
    if (!sku) {
      const prodM = fullText.match(/(?:Product\s*Name|Item\s*Name|Product|Item)\s*[:\-]\s*([A-Za-z0-9_\-\.\s]{3,30})/i);
      if (prodM && prodM[1]) {
        const cleaned = cleanCandidateSku(prodM[1]);
        if (cleaned) sku = cleaned;
      }
    }

    // Fallback: If still not found, use unique order identifier so labels don't merge into one
    if (!sku) {
      sku = orderId !== `ORD-${pageNum}` ? `SKU-${orderId}` : `SKU-PAGE-${pageNum}`;
    }

    return { sku, qty, courier, orderId, awb };
  }

  function cleanCandidateSku(str) {
    if (!str) return '';
    // Cut off if another header keyword appears
    let cleaned = str.split(/(?:Qty|Quantity|Size|Color|Colour|Order|Date|Price|MRP|Total|Invoice|Sub-Order)/i)[0];
    cleaned = cleaned.replace(/[\r\n\t]+/g, ' ').replace(/[\|,:;]/g, '').trim();
    if (cleaned.length > 35) {
      cleaned = cleaned.substring(0, 35).trim();
    }
    // Reject common headers
    if (/^(SKU|Size|Qty|Quantity|Product|Name|Item|Details|Free\s*Size|N\/A|COD|Prepaid)$/i.test(cleaned)) {
      return '';
    }
    return cleaned;
  }

  /**
   * Render a specific page from orders as a high-res thumbnail onto a canvas
   */
  async function renderPageThumbnail(order, sourceFiles, canvasElement, options = {}) {
    try {
      const src = sourceFiles[order.fileIndex];
      if (!src) return;

      const typedArray = new Uint8Array(src.buffer.slice(0));
      const pdfDoc = await window.pdfjsLib.getDocument({
        data: typedArray,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      }).promise;
      const page = await pdfDoc.getPage(order.pageNumber);

      const scale = options.scale || 0.85;
      const viewport = page.getViewport({ scale });

      const ctx = canvasElement.getContext('2d');

      if (options.cropHalf) {
        canvasElement.width = viewport.width;
        canvasElement.height = Math.round(viewport.height * 0.52);
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;
      } else {
        canvasElement.width = viewport.width;
        canvasElement.height = viewport.height;
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;
      }
    } catch (e) {
      console.warn('Thumbnail render note:', e);
    }
  }

  /**
   * Build a sorted list of orders according to user configuration
   */
  function sortOrdersList(orders, skuOrder, sortType) {
    if (sortType === 'courier') {
      return [...orders].sort((a, b) => {
        const cComp = a.courier.localeCompare(b.courier);
        if (cComp !== 0) return cComp;
        return a.sku.localeCompare(b.sku);
      });
    }

    const skuRankMap = new Map();
    skuOrder.forEach((s, idx) => skuRankMap.set(s.toLowerCase(), idx));

    return [...orders].sort((a, b) => {
      const rankA = skuRankMap.has(a.sku.toLowerCase()) ? skuRankMap.get(a.sku.toLowerCase()) : 99999;
      const rankB = skuRankMap.has(b.sku.toLowerCase()) ? skuRankMap.get(b.sku.toLowerCase()) : 99999;

      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.orderId.localeCompare(b.orderId);
    });
  }

  /**
   * Assemble PDF pages with crop and stamping rules
   */
  async function assemblePdfDocument(orderedList, sourceFiles, options, onProgress) {
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    const { cropLabels, trimWhitespace, stampSku, customMessage } = options;

    // Load source PDF documents into cache
    const pdfDocsCache = new Map();
    for (let i = 0; i < sourceFiles.length; i++) {
      const src = sourceFiles[i];
      const doc = await PDFDocument.load(src.buffer.slice(0));
      pdfDocsCache.set(i, doc);
    }

    const outDoc = await PDFDocument.create();
    const fontHelvetica = await outDoc.embedFont(StandardFonts.Helvetica);
    const fontHelveticaBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

    const total = orderedList.length;

    for (let idx = 0; idx < total; idx++) {
      const ord = orderedList[idx];
      const srcDoc = pdfDocsCache.get(ord.fileIndex);

      if (onProgress) {
        const pct = Math.min(95, Math.round((idx / total) * 90) + 5);
        onProgress(pct, `Processing label ${idx + 1} of ${total} (${ord.sku})...`);
      }

      // Copy source page losslessly
      const [copiedPage] = await outDoc.copyPages(srcDoc, [ord.pageIndex]);
      const newPage = outDoc.addPage(copiedPage);
      const { width, height } = newPage.getSize();

      const shouldCrop = cropLabels || trimWhitespace;
      const isFullSheet = height > 500; // standard A4 sheet

      if (shouldCrop && isFullSheet) {
        let cropX = 0;
        let cropY = 504; // Cut right below Product Details divider line (removes 100% of tax invoice!)
        let cropW = width;
        let cropH = height - 504; // Keep top shipping label

        if (trimWhitespace) {
          // Clean thermal 4x6 / 4x4 crop
          cropX = 10;
          cropW = width - 20;
          cropY = 504;
          cropH = 330;
        }

        newPage.setCropBox(cropX, cropY, cropW, cropH);
        newPage.setMediaBox(cropX, cropY, cropW, cropH);

        // Stamp SKU badge if requested
        if (stampSku) {
          const badgeText = `[SKU: ${ord.sku}]  (QTY: ${ord.qty})  ${ord.courier}`;
          const fontSize = 8.5;
          const textWidth = fontHelveticaBold.widthOfTextAtSize(badgeText, fontSize);
          const badgeX = Math.max(cropX + 10, cropX + (cropW - textWidth) / 2);
          const badgeY = cropY + 18;

          newPage.drawRectangle({
            x: badgeX - 4,
            y: badgeY - 2,
            width: textWidth + 8,
            height: 13,
            color: rgb(0.94, 0.95, 0.97),
            borderColor: rgb(0.6, 0.65, 0.7),
            borderWidth: 0.5
          });

          newPage.drawText(badgeText, {
            x: badgeX,
            y: badgeY + 1,
            size: fontSize,
            font: fontHelveticaBold,
            color: rgb(0.05, 0.1, 0.2)
          });
        }

        // Stamp Custom Message if enabled
        if (customMessage && customMessage.trim().length > 0) {
          const msgText = customMessage.trim();
          const fontSize = 7.5;
          const msgWidth = fontHelvetica.widthOfTextAtSize(msgText, fontSize);
          const msgX = Math.max(cropX + 8, cropX + (cropW - msgWidth) / 2);
          const msgY = cropY + 6;

          newPage.drawText(msgText, {
            x: msgX,
            y: msgY,
            size: fontSize,
            font: fontHelvetica,
            color: rgb(0.15, 0.15, 0.15)
          });
        }
      } else {
        // Full label page
        if (stampSku) {
          const stampText = `[SKU: ${ord.sku}] - QTY: ${ord.qty} | ${ord.courier}`;
          const stampY = height - 22;
          newPage.drawRectangle({
            x: 20,
            y: stampY - 3,
            width: 300,
            height: 16,
            color: rgb(1, 1, 1),
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.8
          });
          newPage.drawText(stampText, {
            x: 24,
            y: stampY + 1,
            size: 8.5,
            font: fontHelveticaBold,
            color: rgb(0, 0, 0)
          });
        }

        if (customMessage && customMessage.trim().length > 0) {
          newPage.drawText(customMessage.trim(), {
            x: 25,
            y: 12,
            size: 8,
            font: fontHelvetica,
            color: rgb(0.2, 0.2, 0.2)
          });
        }
      }
    }

    return await outDoc.save();
  }

  /**
   * Generate Sorted PDF (Single PDF or handles Combo grouping)
   */
  async function generateSortedPDF(config, onProgress) {
    const {
      orders,
      sourceFiles,
      skuOrder,
      sortType,
      dropInvoicePages,
      comboSetting,
      cropLabels,
      trimWhitespace,
      stampSku,
      customMessage
    } = config;

    if (onProgress) onProgress(10, 'Initializing PDF generation engine...');

    // Filter out invoice pages if Amazon
    let activeOrders = orders.filter(o => {
      if (dropInvoicePages && o.isInvoice) return false;
      return true;
    });

    let singleOrders = activeOrders.filter(o => o.qty <= 1);
    let comboOrders = activeOrders.filter(o => o.qty > 1);

    let finalOrderedList = [];
    if (comboSetting === 'keep_on_top') {
      finalOrderedList = [
        ...sortOrdersList(comboOrders, skuOrder, sortType),
        ...sortOrdersList(singleOrders, skuOrder, sortType)
      ];
    } else {
      finalOrderedList = sortOrdersList(activeOrders, skuOrder, sortType);
    }

    const options = { cropLabels, trimWhitespace, stampSku, customMessage };
    return await assemblePdfDocument(finalOrderedList, sourceFiles, options, onProgress);
  }

  /**
   * Generate Two Separate PDFs:
   * 1) Single Orders PDF
   * 2) Combo Orders PDF
   */
  async function generateSplitPDFs(config, onProgress) {
    const {
      orders,
      sourceFiles,
      skuOrder,
      sortType,
      dropInvoicePages,
      cropLabels,
      trimWhitespace,
      stampSku,
      customMessage
    } = config;

    let activeOrders = orders.filter(o => !(dropInvoicePages && o.isInvoice));
    let singleOrders = sortOrdersList(activeOrders.filter(o => o.qty <= 1), skuOrder, sortType);
    let comboOrders = sortOrdersList(activeOrders.filter(o => o.qty > 1), skuOrder, sortType);

    const options = { cropLabels, trimWhitespace, stampSku, customMessage };

    if (onProgress) onProgress(10, 'Generating Single Orders PDF...');
    const singlePdfBytes = singleOrders.length > 0
      ? await assemblePdfDocument(singleOrders, sourceFiles, options, (p, m) => onProgress(Math.round(p * 0.5), m))
      : null;

    if (onProgress) onProgress(50, 'Generating Combo / Multi-qty Orders PDF...');
    const comboPdfBytes = comboOrders.length > 0
      ? await assemblePdfDocument(comboOrders, sourceFiles, options, (p, m) => onProgress(50 + Math.round(p * 0.5), m))
      : null;

    return {
      singlePdfBytes,
      comboPdfBytes,
      singleCount: singleOrders.length,
      comboCount: comboOrders.length
    };
  }

  /**
   * Generate 1-Page SKU Pick List / Manifest Summary PDF
   * Sellers print this to pick all items from their warehouse inventory!
   */
  async function generatePickListPDF(config) {
    const { orders, platform } = config;
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;

    const doc = await PDFDocument.create();
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

    // Group items by SKU
    const skuMap = new Map();
    orders.forEach(o => {
      if (o.isInvoice) return;
      if (!skuMap.has(o.sku)) {
        skuMap.set(o.sku, { sku: o.sku, labelsCount: 0, totalPcs: 0, couriers: new Set() });
      }
      const item = skuMap.get(o.sku);
      item.labelsCount++;
      item.totalPcs += o.qty;
      item.couriers.add(o.courier);
    });

    const summaryList = Array.from(skuMap.values()).sort((a, b) => b.totalPcs - a.totalPcs);

    // A4 Page: 595 x 842 pt
    const page = doc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Header Banner
    page.drawRectangle({
      x: 30,
      y: height - 85,
      width: width - 60,
      height: 55,
      color: rgb(0.1, 0.2, 0.45)
    });

    page.drawText(`EvoriaBloom - Warehouse Order Pick List`, {
      x: 45,
      y: height - 58,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    page.drawText(`Marketplace: ${platform.toUpperCase()}  |  Date: ${dateStr}  |  Total Orders: ${orders.length}`, {
      x: 45,
      y: height - 76,
      size: 9,
      font: fontRegular,
      color: rgb(0.85, 0.9, 1)
    });

    // Table Header
    let currentY = height - 120;
    page.drawRectangle({
      x: 30,
      y: currentY - 6,
      width: width - 60,
      height: 22,
      color: rgb(0.93, 0.95, 0.98)
    });

    page.drawText('#', { x: 40, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('SKU Name / Code', { x: 70, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Orders', { x: 330, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Total Pcs', { x: 390, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Courier Partners', { x: 460, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

    currentY -= 20;

    // Table Rows
    summaryList.forEach((item, idx) => {
      if (currentY < 50) return; // Prevent overflow on 1 page

      const isEven = idx % 2 === 0;
      if (isEven) {
        page.drawRectangle({
          x: 30,
          y: currentY - 5,
          width: width - 60,
          height: 18,
          color: rgb(0.98, 0.98, 0.99)
        });
      }

      page.drawText(`${idx + 1}`, { x: 40, y: currentY, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
      
      const cleanSku = item.sku.length > 40 ? item.sku.substring(0, 38) + '...' : item.sku;
      page.drawText(cleanSku, { x: 70, y: currentY, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(`${item.labelsCount}`, { x: 335, y: currentY, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(`${item.totalPcs}`, { x: 395, y: currentY, size: 9, font: fontBold, color: rgb(0.1, 0.4, 0.8) });

      const couriersStr = Array.from(item.couriers).join(', ');
      page.drawText(couriersStr.substring(0, 20), { x: 460, y: currentY, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

      currentY -= 19;
    });

    // Footer note
    page.drawText(`Generated by EvoriaBloom · 100% Free & Private Seller Utility`, {
      x: 180,
      y: 20,
      size: 8,
      font: fontRegular,
      color: rgb(0.6, 0.6, 0.6)
    });

    return await doc.save();
  }

  // Public API
  return {
    parseFiles,
    renderPageThumbnail,
    generateSortedPDF,
    generateSplitPDFs,
    generatePickListPDF
  };
})();
