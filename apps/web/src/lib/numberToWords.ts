// Convert number to words (Indian numbering system)
export function numberToWords(amount: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]

  function convertHundreds(num: number): string {
    let result = ''
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred '
      num %= 100
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' '
      num %= 10
    }
    if (num > 0) {
      result += ones[num] + ' '
    }
    return result.trim()
  }

  function convert(num: number): string {
    if (num === 0) return 'Zero'

    let result = ''

    // Crores
    if (num >= 10000000) {
      result += convertHundreds(Math.floor(num / 10000000)) + ' Crore '
      num %= 10000000
    }

    // Lakhs
    if (num >= 100000) {
      result += convertHundreds(Math.floor(num / 100000)) + ' Lakh '
      num %= 100000
    }

    // Thousands
    if (num >= 1000) {
      result += convertHundreds(Math.floor(num / 1000)) + ' Thousand '
      num %= 1000
    }

    // Hundreds, Tens, Ones
    if (num > 0) {
      result += convertHundreds(num)
    }

    return result.trim()
  }

  // Amount is now in rupees (not paise)
  // Split into rupees and paise (decimal part)
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)

  let words = convert(rupees)
  if (words) {
    words += ' Rupees'
  }
  if (paise > 0) {
    words += (words ? ' and ' : '') + convert(paise) + ' Paise'
  } else {
    words += ' Only'
  }

  return words
}

