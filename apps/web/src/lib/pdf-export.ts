import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Completely avoid html2canvas by using a different approach
export async function exportElementToPDFSimple({
  elementId,
  filename,
  scale = 2,
  backgroundColor = '#ffffff'
}: PDFExportOptions): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  console.log('Starting simple PDF export for element:', elementId)

  try {
    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Add title
    pdf.setFontSize(20)
    pdf.text('Orders Report', 20, 20)
    
    // Add date
    pdf.setFontSize(12)
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
    
    // Add a line
    pdf.line(20, 35, 190, 35)
    
    // Get the text content from the element
    const textContent = element.innerText || element.textContent || ''
    
    // Split text into lines that fit the page
    const pageWidth = 170 // A4 width minus margins
    const lineHeight = 6
    let yPosition = 45
    
    const lines = textContent.split('\n')
    
    for (const line of lines) {
      if (yPosition > 280) { // Start new page
        pdf.addPage()
        yPosition = 20
      }
      
      // Simple text wrapping
      const wrappedLines = pdf.splitTextToSize(line, pageWidth)
      
      for (const wrappedLine of wrappedLines) {
        if (yPosition > 280) {
          pdf.addPage()
          yPosition = 20
        }
        
        pdf.text(wrappedLine, 20, yPosition)
        yPosition += lineHeight
      }
    }
    
    // Save the PDF
    pdf.save(filename)
    console.log('Simple PDF export completed successfully!')
    
  } catch (error) {
    console.error('Error during simple PDF export:', error)
    throw error
  }
}

// Advanced PDF export that extracts structured data
export async function exportStructuredPDF({
  elementId,
  filename,
  reportType = 'orders'
}: PDFExportOptions & { reportType?: 'orders' | 'purchase-orders' }): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  console.log('Starting structured PDF export for element:', elementId)

  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    let yPosition = 20

    // Helper function to add text with page break
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, x: number = 20) => {
      if (yPosition > 280) {
        pdf.addPage()
        yPosition = 20
      }
      
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal')
      
      const lines = pdf.splitTextToSize(text, 170)
      for (const line of lines) {
        if (yPosition > 280) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(line, x, yPosition)
        yPosition += fontSize * 0.4
      }
    }

    // Add header
    addText(`${reportType === 'orders' ? 'Customer Orders' : 'Purchase Orders'} Report`, 20, true)
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 12)
    addText('', 12) // Empty line
    
    // Add summary cards data
    const summaryCards = element.querySelectorAll('[class*="bg-white"]')
    summaryCards.forEach(card => {
      const title = card.querySelector('dt')?.textContent || ''
      const value = card.querySelector('dd')?.textContent || ''
      if (title && value) {
        addText(`${title}: ${value}`, 12, true)
      }
    })
    
    addText('', 12) // Empty line
    
    // Add table data with proper formatting
    const tables = element.querySelectorAll('table')
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr')
      
      // Process table headers
      const headerRow = rows[0]
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th')
        if (headerCells.length > 0) {
          // Create a formatted header row
          const headers = Array.from(headerCells).map(cell => cell.textContent?.trim() || '')
          
          // Add headers with proper spacing
          addText('ORDER DETAILS', 14, true)
          addText('', 12) // Empty line
          
          // Add column headers
          const headerText = headers.join(' | ')
          addText(headerText, 10, true)
          
          // Add separator line
          addText('─'.repeat(80), 10)
        }
      }
      
      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const cells = row.querySelectorAll('td')
        
        if (cells.length > 0) {
          const cellData = Array.from(cells).map(cell => {
            const text = cell.textContent?.trim() || ''
            // Clean up the text and limit length to prevent truncation
            return text.length > 20 ? text.substring(0, 17) + '...' : text
          })
          
          // Format each row with proper spacing
          const rowText = cellData.join(' | ')
          addText(rowText, 9, false)
        }
      }
      
      addText('', 12) // Empty line after each table
    })
    
    // Add footer
    addText('', 12) // Empty line
    addText('─'.repeat(80), 10)
    addText('End of Report', 10, true)
    
    // Save the PDF
    pdf.save(filename)
    console.log('Structured PDF export completed successfully!')
    
  } catch (error) {
    console.error('Error during structured PDF export:', error)
    throw error
  }
}

// Enhanced PDF export with proper table formatting using autoTable
export async function exportTablePDF({
  elementId,
  filename,
  reportType = 'orders'
}: PDFExportOptions & { reportType?: 'orders' | 'purchase-orders' }): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  console.log('Starting table PDF export for element:', elementId)

  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Add header
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${reportType === 'orders' ? 'Customer Orders' : 'Purchase Orders'} Report`, 20, 20)
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
    
    // Add summary cards data
    const summaryCards = element.querySelectorAll('[class*="bg-white"]')
    const summaryData: string[][] = []
    
    summaryCards.forEach(card => {
      const title = card.querySelector('dt')?.textContent || ''
      const value = card.querySelector('dd')?.textContent || ''
      if (title && value) {
        summaryData.push([title, value])
      }
    })
    
    if (summaryData.length > 0) {
      pdf.autoTable({
        startY: 40,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 }
        }
      })
    }
    
    // Extract table data
    const tables = element.querySelectorAll('table')
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr')
      const tableData: string[][] = []
      
      // Process headers
      const headerRow = rows[0]
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th')
        if (headerCells.length > 0) {
          const headers = Array.from(headerCells).map(cell => cell.textContent?.trim() || '')
          tableData.push(headers)
        }
      }
      
      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const cells = row.querySelectorAll('td')
        
        if (cells.length > 0) {
          const cellData = Array.from(cells).map(cell => {
            const text = cell.textContent?.trim() || ''
            // Clean up the text but don't truncate too much
            return text.length > 25 ? text.substring(0, 22) + '...' : text
          })
          tableData.push(cellData)
        }
      }
      
      if (tableData.length > 0) {
        const startY = (pdf as any).lastAutoTable?.finalY || 60
        
        pdf.autoTable({
          startY: startY + 20,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 20 }, // Order
            1: { cellWidth: 30 }, // Customer
            2: { cellWidth: 25 }, // Phone
            3: { cellWidth: 15 }, // Items
            4: { cellWidth: 20 }, // Date
            5: { cellWidth: 20 }, // Status
            6: { cellWidth: 20 }  // Amount
          },
          didDrawPage: (data: any) => {
            // Add page number
            const pageSize = pdf.internal.pageSize
            const pageHeight = pageSize.height || pageSize.getHeight()
            pdf.setFontSize(8)
            pdf.text(`Page ${data.pageNumber}`, pageSize.width - 20, pageHeight - 10)
          }
        })
      }
    })
    
    // Save the PDF
    pdf.save(filename)
    console.log('Table PDF export completed successfully!')
    
  } catch (error) {
    console.error('Error during table PDF export:', error)
    throw error
  }
}

// Alternative PDF export method that avoids html2canvas issues
export async function exportElementToPDFAlternative({
  elementId,
  filename,
  scale = 2,
  backgroundColor = '#ffffff'
}: PDFExportOptions): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  console.log('Starting alternative PDF export for element:', elementId)

  try {
    // Create a temporary element with simplified styling
    const tempElement = element.cloneNode(true) as HTMLElement
    
    // Remove all classes that might contain lab() colors
    const allElements = tempElement.querySelectorAll('*')
    allElements.forEach(el => {
      const htmlEl = el as HTMLElement
      htmlEl.className = htmlEl.className
        .split(' ')
        .filter(cls => !cls.includes('bg-') && !cls.includes('text-') && !cls.includes('border-'))
        .join(' ')
    })
    
    // Apply basic styling
    tempElement.style.cssText = `
      font-family: Arial, sans-serif;
      color: #000000;
      background-color: #ffffff;
      padding: 20px;
      line-height: 1.4;
    `
    
    // Create a temporary container
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 800px;
      background: white;
      padding: 20px;
    `
    tempContainer.appendChild(tempElement)
    document.body.appendChild(tempContainer)
    
    // Use html2canvas with minimal configuration
    const canvas = await html2canvas(tempContainer, {
      scale: 1,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: false,
      allowTaint: true
    })
    
    // Clean up
    document.body.removeChild(tempContainer)
    
    // Generate PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    pdf.save(filename)
    console.log('Alternative PDF export completed successfully!')
    
  } catch (error) {
    console.error('Error during alternative PDF export:', error)
    throw error
  }
}

interface PDFExportOptions {
  elementId: string
  filename: string
  scale?: number
  backgroundColor?: string
}

export async function exportElementToPDF({
  elementId,
  filename,
  scale = 2,
  backgroundColor = '#ffffff'
}: PDFExportOptions): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  console.log('Starting PDF export for element:', elementId)

  try {
    console.log('Creating canvas with html2canvas...')
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false, // Disable logging to reduce noise
      foreignObjectRendering: false, // Disable foreign object rendering
      removeContainer: true, // Remove container after rendering
      ignoreElements: (element) => {
        // Skip elements that might cause issues
        return element.classList?.contains('ignore-pdf') || false
      },
      onclone: (clonedDoc) => {
        console.log('Processing cloned document for color conversion...')
        
        // Remove ALL existing stylesheets and styles to prevent lab() color issues
        const allStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]')
        allStyles.forEach(style => style.remove())
        
        // Override the CSS parsing to prevent lab() color errors
        const originalSupports = clonedDoc.defaultView?.CSS?.supports.bind(clonedDoc.defaultView.CSS)
        if (clonedDoc.defaultView?.CSS && originalSupports) {
          const customSupports: typeof clonedDoc.defaultView.CSS.supports = (property: any, value?: any) => {
            if (typeof value === 'string' && value.includes('lab(')) {
              return false
            }
            if (value === undefined && typeof property === 'string' && property.includes('lab(')) {
              return false
            }
            return originalSupports(property, value)
          }
          clonedDoc.defaultView.CSS.supports = customSupports
        }
        
        // Override getComputedStyle to replace lab() colors
        const originalGetComputedStyle = clonedDoc.defaultView?.getComputedStyle
        if (clonedDoc.defaultView) {
          clonedDoc.defaultView.getComputedStyle = function(element: Element, pseudoElt?: string | null) {
            const computedStyle = originalGetComputedStyle ? originalGetComputedStyle.call(this, element, pseudoElt) : {} as CSSStyleDeclaration
            
            // Create a proxy to intercept color-related properties
            return new Proxy(computedStyle, {
              get(target, prop) {
                const value = target[prop as keyof CSSStyleDeclaration]
                if (typeof value === 'string' && value.includes('lab(')) {
                  // Replace lab() colors with fallback RGB values
                  return value.replace(/lab\([^)]+\)/g, '#000000')
                }
                return value
              }
            })
          }
        }
        
        // Create a comprehensive style override
        const style = clonedDoc.createElement('style')
        style.textContent = `
        /* Global reset to prevent lab() color issues */
        *, *::before, *::after {
          color: inherit !important;
          background-color: inherit !important;
          border-color: inherit !important;
        }
        
        /* Force all elements to use RGB colors only */
        html, body, div, span, p, h1, h2, h3, h4, h5, h6, 
        table, tr, td, th, button, input, select, textarea {
          color: #000000 !important;
        }
        /* Background colors */
        .bg-blue-500 { background-color: #3b82f6 !important; }
        .bg-green-500 { background-color: #10b981 !important; }
        .bg-yellow-500 { background-color: #f59e0b !important; }
        .bg-red-500 { background-color: #ef4444 !important; }
        .bg-purple-500 { background-color: #8b5cf6 !important; }
        .bg-gray-500 { background-color: #6b7280 !important; }
        .bg-indigo-500 { background-color: #6366f1 !important; }
        .bg-pink-500 { background-color: #ec4899 !important; }
        .bg-orange-500 { background-color: #f97316 !important; }
        .bg-teal-500 { background-color: #14b8a6 !important; }
        .bg-cyan-500 { background-color: #06b6d4 !important; }
        .bg-emerald-500 { background-color: #10b981 !important; }
        .bg-lime-500 { background-color: #84cc16 !important; }
        .bg-amber-500 { background-color: #f59e0b !important; }
        .bg-rose-500 { background-color: #f43f5e !important; }
        .bg-slate-500 { background-color: #64748b !important; }
        .bg-zinc-500 { background-color: #71717a !important; }
        .bg-neutral-500 { background-color: #737373 !important; }
        .bg-stone-500 { background-color: #78716c !important; }
        
        /* Text colors */
        .text-blue-500 { color: #3b82f6 !important; }
        .text-green-500 { color: #10b981 !important; }
        .text-yellow-500 { color: #f59e0b !important; }
        .text-red-500 { color: #ef4444 !important; }
        .text-purple-500 { color: #8b5cf6 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-indigo-500 { color: #6366f1 !important; }
        .text-pink-500 { color: #ec4899 !important; }
        .text-orange-500 { color: #f97316 !important; }
        .text-teal-500 { color: #14b8a6 !important; }
        .text-cyan-500 { color: #06b6d4 !important; }
        .text-emerald-500 { color: #10b981 !important; }
        .text-lime-500 { color: #84cc16 !important; }
        .text-amber-500 { color: #f59e0b !important; }
        .text-rose-500 { color: #f43f5e !important; }
        .text-slate-500 { color: #64748b !important; }
        .text-zinc-500 { color: #71717a !important; }
        .text-neutral-500 { color: #737373 !important; }
        .text-stone-500 { color: #78716c !important; }
        
        /* Border colors */
        .border-blue-500 { border-color: #3b82f6 !important; }
        .border-green-500 { border-color: #10b981 !important; }
        .border-yellow-500 { border-color: #f59e0b !important; }
        .border-red-500 { border-color: #ef4444 !important; }
        .border-purple-500 { border-color: #8b5cf6 !important; }
        .border-gray-500 { border-color: #6b7280 !important; }
        .border-indigo-500 { border-color: #6366f1 !important; }
        .border-pink-500 { border-color: #ec4899 !important; }
        .border-orange-500 { border-color: #f97316 !important; }
        .border-teal-500 { border-color: #14b8a6 !important; }
        .border-cyan-500 { border-color: #06b6d4 !important; }
        .border-emerald-500 { border-color: #10b981 !important; }
        .border-lime-500 { border-color: #84cc16 !important; }
        .border-amber-500 { border-color: #f59e0b !important; }
        .border-rose-500 { border-color: #f43f5e !important; }
        .border-slate-500 { border-color: #64748b !important; }
        .border-zinc-500 { border-color: #71717a !important; }
        .border-neutral-500 { border-color: #737373 !important; }
        .border-stone-500 { border-color: #78716c !important; }
        
        /* Status colors */
        .bg-yellow-100 { background-color: #fef3c7 !important; }
        .bg-blue-100 { background-color: #dbeafe !important; }
        .bg-green-100 { background-color: #dcfce7 !important; }
        .bg-red-100 { background-color: #fee2e2 !important; }
        .bg-gray-100 { background-color: #f3f4f6 !important; }
        .text-yellow-800 { color: #92400e !important; }
        .text-blue-800 { color: #1e40af !important; }
        .text-green-800 { color: #166534 !important; }
        .text-red-800 { color: #991b1b !important; }
        .text-gray-800 { color: #1f2937 !important; }
      `
        clonedDoc.head.appendChild(style)
      }
    })

    console.log('Canvas created successfully, generating image data...')
    const imgData = canvas.toDataURL('image/png')
  
    console.log('Creating PDF document...')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    console.log('Saving PDF:', filename)
    pdf.save(filename)
    console.log('PDF export completed successfully!')
  } catch (error) {
    console.error('Error during PDF export:', error)
    throw error
  }
}
