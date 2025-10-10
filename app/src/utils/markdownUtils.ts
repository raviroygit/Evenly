/**
 * Utility functions for processing markdown content in chat messages
 */

/**
 * Process markdown content to enhance expense-related formatting
 * @param content - The raw markdown content
 * @returns Processed markdown content with enhanced formatting
 */
export const processExpenseMarkdown = (content: string): string => {
  return content
    // Bold currency amounts
    .replace(/\$(\d+(?:\.\d{2})?)/g, '**$$$1**')
    .replace(/(\d+(?:\.\d{2})?)\s*(USD|EUR|GBP|INR|CAD|AUD|JPY|CHF)/gi, '**$1 $2**')
    
    // Bold percentages
    .replace(/(\d+(?:\.\d+)?)%/g, '**$1%**')
    
    // Bold common expense terms
    .replace(/split\s+equally/gi, '**split equally**')
    .replace(/who\s+owes\s+whom/gi, '**who owes whom**')
    .replace(/net\s+balance/gi, '**net balance**')
    .replace(/total\s+amount/gi, '**total amount**')
    .replace(/per\s+person/gi, '**per person**')
    .replace(/settlement/gi, '**settlement**')
    .replace(/payment/gi, '**payment**')
    
    // Format calculations
    .replace(/(\d+(?:\.\d{2})?)\s*\/\s*(\d+)\s*=\s*(\d+(?:\.\d{2})?)/g, '`$1 ÷ $2 = $3`')
    
    // Format expense categories
    .replace(/(food|groceries|rent|utilities|transport|entertainment|other)/gi, '*$1*')
    
    // Format user names (assuming they're in quotes or specific patterns)
    .replace(/"([^"]+)"/g, '**$1**');
};

/**
 * Create markdown styles object for chat messages
 * @param colors - Theme colors object
 * @param chatColors - Chat-specific colors
 * @returns Markdown styles object
 */
export const createMarkdownStyles = (colors: any, chatColors: any) => ({
  body: {
    color: chatColors.text,
    fontSize: 16,
    lineHeight: 22,
    margin: 0,
    padding: 0,
  },
  heading1: {
    color: chatColors.text,
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 26,
  },
  heading2: {
    color: chatColors.text,
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginTop: 14,
    marginBottom: 6,
    lineHeight: 24,
  },
  heading3: {
    color: chatColors.text,
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 22,
  },
  paragraph: {
    color: chatColors.text,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 8,
  },
  strong: {
    color: chatColors.text,
    fontWeight: 'bold' as const,
  },
  em: {
    color: chatColors.text,
    fontStyle: 'italic' as const,
  },
  code_inline: {
    backgroundColor: chatColors.background,
    color: colors.primary,
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  code_block: {
    backgroundColor: chatColors.background,
    color: chatColors.text,
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: 'monospace',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  fence: {
    backgroundColor: chatColors.background,
    color: chatColors.text,
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: 'monospace',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  blockquote: {
    backgroundColor: chatColors.background,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    fontStyle: 'italic' as const,
    color: chatColors.textSecondary,
  },
  list_item: {
    color: chatColors.text,
    fontSize: 16,
    lineHeight: 22,
    marginVertical: 2,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline' as const,
  },
  table: {
    borderWidth: 1,
    borderColor: chatColors.border,
    borderRadius: 8,
    marginVertical: 8,
  },
  thead: {
    backgroundColor: chatColors.background,
  },
  tbody: {
    backgroundColor: chatColors.messageBackground,
  },
  th: {
    color: chatColors.text,
    fontWeight: 'bold' as const,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: chatColors.border,
  },
  td: {
    color: chatColors.text,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: chatColors.border,
  },
  hr: {
    backgroundColor: chatColors.border,
    height: 1,
    marginVertical: 16,
  },
});

/**
 * Sample markdown content for testing
 */
export const sampleExpenseMarkdown = `
# Expense Calculation Example

Here's how to **split equally** a restaurant bill:

## Bill Details
- **Total Amount**: $120.00
- **Number of people**: 4
- **Per person**: $30.00

## Calculation
\`120 ÷ 4 = 30\`

### Who owes whom:
1. Alice owes Bob **$15.00**
2. Charlie owes Alice **$25.00**
3. David owes Charlie **$10.00**

> **Tip**: Always confirm the total before splitting!

**Net balance** for each person:
- Alice: +$10.00 (lent)
- Bob: -$15.00 (borrowed)
- Charlie: +$15.00 (lent)
- David: -$10.00 (borrowed)

---

*This is an example of how markdown formatting works in the chat.*
`;
