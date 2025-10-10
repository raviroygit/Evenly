/**
 * Test data for demonstrating markdown rendering capabilities
 */

export const markdownTestMessages = [
  {
    id: 'test-1',
    type: 'assistant' as const,
    content: `# Welcome to Evenly Expense Assistant! 

I can help you with **expense splitting** and financial calculations. Here are some examples:

## Basic Calculations
- Split $120 equally among 4 people = **$30 each**
- Percentage split: 40% to Alice, 35% to Bob, 25% to Carol
- Shares-based: Alice pays 2 shares, Bob pays 1 share, Carol pays 1 share

## Common Scenarios
1. **Restaurant bills** - Split equally or by item
2. **Rent and utilities** - Fixed amounts per person  
3. **Group trips** - Variable expenses with different shares
4. **Shared subscriptions** - Monthly recurring costs

> **Pro tip**: Always confirm totals before splitting to avoid confusion!

### Who owes whom example:
\`$150 ÷ 3 people = $50 per person\`

**Net balance** summary:
- Alice: +$25.00 (lent)
- Bob: -$15.00 (borrowed) 
- Charlie: -$10.00 (borrowed)

---

*Need help with a specific expense? Just ask!*`,
    timestamp: new Date(),
  },
  {
    id: 'test-2', 
    type: 'assistant' as const,
    content: `## Currency Support

I support multiple currencies:

| Currency | Symbol | Example |
|----------|--------|---------|
| US Dollar | USD | $100.00 |
| Euro | EUR | €85.50 |
| British Pound | GBP | £75.25 |
| Indian Rupee | INR | ₹5,000 |

### Multi-currency groups
When dealing with different currencies, I can help with:
- **Exchange rate calculations**
- **Currency conversion** 
- **Fair splitting** across currencies

**Note**: Always use current exchange rates for accurate calculations.`,
    timestamp: new Date(),
  },
  {
    id: 'test-3',
    type: 'assistant' as const, 
    content: `## Code Examples

Here's how to calculate equal splits:

\`\`\`
Total Amount: $200.00
Number of People: 5
Per Person: $200.00 ÷ 5 = $40.00
\`\`\`

### Advanced Calculations
For percentage-based splits:

\`\`\`
Total: $300.00
- Alice: 50% = $150.00
- Bob: 30% = $90.00  
- Carol: 20% = $60.00
Total: $150 + $90 + $60 = $300.00 ✓
\`\`\`

**Formula**: \`Amount × Percentage ÷ 100 = Share\``,
    timestamp: new Date(),
  }
];

export const sampleUserMessages = [
  {
    id: 'user-1',
    type: 'user' as const,
    content: 'How do I split a $120 restaurant bill equally among 4 people?',
    timestamp: new Date(),
  },
  {
    id: 'user-2', 
    type: 'user' as const,
    content: 'Can you help me calculate who owes whom in my group?',
    timestamp: new Date(),
  },
  {
    id: 'user-3',
    type: 'user' as const,
    content: 'What\'s the best way to handle currency differences in international groups?',
    timestamp: new Date(),
  }
];
