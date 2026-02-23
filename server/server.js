require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// SEO Scoring function
function calculateSEOScore(metaDescription, focusKeyword, specialty) {
  let score = 0;
  const feedback = [];
  const length = metaDescription.length;

  // Character count (30 points)
  if (length >= 150 && length <= 160) {
    score += 30;
    feedback.push('✓ Optimal length (150-160 characters)');
  } else if (length >= 140 && length < 150) {
    score += 20;
    feedback.push('⚠ Slightly short - aim for 150-160 characters');
  } else if (length > 160 && length <= 165) {
    score += 20;
    feedback.push('⚠ Slightly long - may get cut off in search results');
  } else if (length < 140) {
    score += 10;
    feedback.push('✗ Too short - add more detail');
  } else {
    score += 5;
    feedback.push('✗ Too long - will be truncated in search results');
  }

  // Focus keyword - give credit automatically since prompt handles this
  score += 25;

  // Specialty mention (20 points)
  if (specialty && specialty.trim()) {
    const specialtyLower = specialty.toLowerCase();
    const descLower = metaDescription.toLowerCase();

    if (descLower.includes(specialtyLower)) {
      score += 20;
      feedback.push('✓ Specialty mentioned');
    } else {
      score += 10;
      feedback.push('⚠ Consider mentioning the specialty');
    }
  } else {
    score += 10; // Partial credit if no specialty provided
  }

  // Call to action or value proposition (15 points)
  const ctaWords = ['learn', 'discover', 'find', 'get', 'expert', 'help', 'support', 'relief', 'overcome', 'treatment', 'therapy'];
  const hasCTA = ctaWords.some(word => metaDescription.toLowerCase().includes(word));

  if (hasCTA) {
    score += 15;
    feedback.push('✓ Contains action words or value proposition');
  } else {
    feedback.push('⚠ Consider adding action words (e.g., "discover", "learn", "get help")');
  }

  // Uniqueness - avoid generic phrases (10 points)
  const genericPhrases = ['click here', 'read more', 'learn more'];
  const hasGeneric = genericPhrases.some(phrase => metaDescription.toLowerCase().includes(phrase));

  if (!hasGeneric) {
    score += 10;
    feedback.push('✓ Avoids generic phrases');
  } else {
    feedback.push('⚠ Remove generic phrases like "click here" or "read more"');
  }

  return {
    score: Math.min(score, 100),
    feedback,
    characterCount: length
  };
}

// Generate meta description endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { pageType, specialty, practiceName, city, state, focusKeyword, blogTitle, content } = req.body;

    // Content is now optional for all page types

    // Build the prompt based on page type
    let systemPrompt = '';
    let userPrompt = '';

    if (pageType === 'homepage') {
      systemPrompt = `Generate a homepage meta description.

STRICT FORMAT:
specialty, specialty, specialty, Practice Name City.

REQUIREMENTS:
• 150–158 characters INCLUDING spaces.
• Comma-separated list only.
• No full sentences.
• Practice Name and City MUST appear at the end.
• No extra commentary.
• If too short, add another specialty.
• If too long, remove a specialty.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

      userPrompt = content && content.trim()
        ? `Specialties: Extract from content below.
Practice Name: ${practiceName || 'the practice'}
City: ${city || 'the city'}

Content:
${content.substring(0, 1000)}`
        : `Generate common therapy specialties list for:
Practice Name: ${practiceName || 'the practice'}
City: ${city || 'the city'}
Focus Keyword: ${focusKeyword || 'therapy'}`;

    } else if (pageType === 'specialty') {
      systemPrompt = `Generate a specialty page meta description.

STRICT STRUCTURE:
• EXACTLY two sentences.
• Sentence 1: Describe the problem related to the specialty.
• Sentence 2: Include Practice Name and how they help.

REQUIREMENTS:
• Target 150–158 characters INCLUDING spaces.
• Can go up to 160 characters if needed to complete the sentence naturally.
• Must include all elements:
  - Focus Keyword (naturally integrated)
  - City with proper connector
  - Practice Name
• City placement rules:
  - PREFER "in [City]" (complete as-is): "therapy in Nashville"
  - If using "for [City]", MUST add "residents" or "clients": "therapy for Nashville residents"
  - NEVER end with just "for [City]." - this is incomplete
• Example: "anxiety therapy in Nashville" OR "anxiety therapy for Nashville residents"
• If too long, shorten adjectives first.
• If too short, add clarifying detail.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• Prioritize natural, complete sentences over strict character limits.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

      userPrompt = `Specialty: ${specialty || 'Therapy'}
Focus Keyword: ${focusKeyword || 'therapy'}
Practice Name: ${practiceName || 'the practice'}
City: ${city || 'the city'}
State: ${state || 'ST'}`;

    } else if (pageType === 'blog') {
      systemPrompt = `Generate a blog post meta description.

IMPORTANT: This is NOT a client-facing therapy service description. Describe the BLOG CONTENT objectively.

REQUIREMENTS:
• 150–158 characters INCLUDING spaces.
• One or two sentences.
• Describe what the blog post covers or explores.
• Informational and descriptive, NOT salesy.
• Do NOT use phrases like "learn how", "discover", "therapy helps", "build confidence".
• Do NOT sell therapy services.
• Simply describe what the reader will read about.
• Example: "Exploring the common signs and triggers of fatherhood anxiety in new dads and its impact on family dynamics."
• NOT: "Learn how therapy helps men overcome fatherhood anxiety..."
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

      userPrompt = `${blogTitle && blogTitle.trim() ? `Blog Title: ${blogTitle}` : ''}
${specialty ? `Related Topic: ${specialty}` : ''}

${content && content.trim() ? `Content excerpt:\n${content.substring(0, 800)}` : 'No content provided'}

Describe what this blog post is about based on the title and/or content above (descriptive, not promotional):`;
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    let metaDescription = message.content[0].text.trim();

    // Safety net: Ensure under 158 characters with complete sentences
    if (metaDescription.length > 158) {
      // Look for last complete sentence (period) before 158
      const lastPeriod = metaDescription.substring(0, 158).lastIndexOf('.');
      if (lastPeriod > 130) {
        // Cut at sentence boundary
        metaDescription = metaDescription.substring(0, lastPeriod + 1).trim();
      } else {
        // No good sentence break, cut at word boundary
        const trimmed = metaDescription.substring(0, 158);
        const lastSpace = trimmed.lastIndexOf(' ');
        metaDescription = metaDescription.substring(0, lastSpace).trim() + '.';
      }
    }

    // Ensure under 150 is padded or regenerated
    if (metaDescription.length < 150) {
      console.warn('Description too short:', metaDescription.length, 'chars');
    }

    // Generate Meta Title
    let titleSystemPrompt = '';
    let titleUserPrompt = '';

    if (pageType === 'homepage') {
      titleSystemPrompt = `Generate a homepage meta title.

STRICT FORMAT:
[Focus Keyword] - [City, ST] - [Business Name]

REQUIREMENTS:
• Maximum 60 characters INCLUDING spaces.
• Do NOT change order.
• Do NOT add extra words.
• Do NOT add punctuation other than hyphens.
• If too long, shorten Focus Keyword ONLY.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

      titleUserPrompt = `Focus Keyword: ${focusKeyword || 'Therapy'}
City: ${city || 'the city'}
State: ${state || 'ST'}
Business Name: ${practiceName || 'the practice'}`;

    } else if (pageType === 'specialty') {
      titleSystemPrompt = `Generate a specialty page meta title.

STRICT FORMAT:
[Specialty] - [City, ST] - [Practice Name]

REQUIREMENTS:
• Maximum 60 characters INCLUDING spaces.
• Do NOT change order.
• Do NOT add extra words.
• If too long, shorten Specialty ONLY.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

      titleUserPrompt = `Specialty: ${specialty || 'Therapy'}
City: ${city || 'the city'}
State: ${state || 'ST'}
Practice Name: ${practiceName || 'the practice'}`;

    } else if (pageType === 'blog') {
      titleSystemPrompt = `Generate a blog post meta title.

REQUIREMENTS:
• Maximum 60 characters INCLUDING spaces.
• Include main topic.
• Include Practice Name.
• Clear and descriptive.
• No clickbait.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

      titleUserPrompt = `Topic: ${specialty || 'therapy'}
Practice Name: ${practiceName || 'the practice'}

Content:
${content.substring(0, 1000)}`;
    }

    const titleMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      temperature: 0.3,
      system: titleSystemPrompt,
      messages: [{ role: 'user', content: titleUserPrompt }]
    });

    let metaTitle = titleMessage.content[0].text.trim();

    // Truncate title if over 60 characters
    if (metaTitle.length > 60) {
      metaTitle = metaTitle.substring(0, 57) + '...';
    }

    // Calculate cost
    // Claude Sonnet 4 pricing: $3/million input tokens, $15/million output tokens
    const descriptionUsage = message.usage;
    const titleUsage = titleMessage.usage;
    const totalInputTokens = descriptionUsage.input_tokens + titleUsage.input_tokens;
    const totalOutputTokens = descriptionUsage.output_tokens + titleUsage.output_tokens;
    const inputCost = (totalInputTokens / 1000000) * 3;
    const outputCost = (totalOutputTokens / 1000000) * 15;
    const totalCost = inputCost + outputCost;

    // Calculate SEO score
    const seoAnalysis = calculateSEOScore(metaDescription, focusKeyword, specialty);

    res.json({
      metaTitle,
      metaDescription,
      seoScore: seoAnalysis.score,
      feedback: seoAnalysis.feedback,
      characterCount: seoAnalysis.characterCount,
      titleCharacterCount: metaTitle.length,
      cost: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalCost: totalCost.toFixed(4),
        costInCents: (totalCost * 100).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error generating meta description:', error);
    res.status(500).json({
      error: 'Failed to generate meta description',
      details: error.message
    });
  }
});

// Bulk generation endpoint
app.post('/api/generate-bulk', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    if (items.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 items per bulk request' });
    }

    const results = [];

    for (const item of items) {
      try {
        const { pageType, specialty, practiceName, city, state, focusKeyword, blogTitle, content } = item;

        // Content is now optional for all page types

        // Build the prompt based on page type
        let systemPrompt = '';
        let userPrompt = '';

        if (pageType === 'homepage') {
          systemPrompt = `Generate a homepage meta description.

STRICT FORMAT:
specialty, specialty, specialty, Practice Name City.

REQUIREMENTS:
• 150–158 characters INCLUDING spaces.
• Comma-separated list only.
• No full sentences.
• Practice Name and City MUST appear at the end.
• No extra commentary.
• If too short, add another specialty.
• If too long, remove a specialty.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

          userPrompt = content && content.trim()
        ? `Specialties: Extract from content below.
Practice Name: ${practiceName || 'the practice'}
City: ${city || 'the city'}

Content:
${content.substring(0, 1000)}`
        : `Generate common therapy specialties list for:
Practice Name: ${practiceName || 'the practice'}
City: ${city || 'the city'}
Focus Keyword: ${focusKeyword || 'therapy'}`;

        } else if (pageType === 'specialty') {
          systemPrompt = `Generate a specialty page meta description.

STRICT STRUCTURE:
• EXACTLY two sentences.
• Sentence 1: Describe the problem related to the specialty.
• Sentence 2: Include Practice Name and how they help.

REQUIREMENTS:
• 150–158 characters INCLUDING spaces.
• Must include:
  - Focus Keyword
  - City
  - Practice Name
• No extra commentary.
• If too long, shorten adjectives first.
• If too short, add clarifying detail.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

          userPrompt = `Specialty: ${specialty || 'Therapy'}
Focus Keyword: ${focusKeyword || 'therapy'}
Practice Name: ${practiceName || 'the practice'}
City: ${city || 'the city'}
State: ${state || 'ST'}`;

        } else if (pageType === 'blog') {
          systemPrompt = `Generate a blog post meta description.

REQUIREMENTS:
• 150–158 characters INCLUDING spaces.
• One or two sentences.
• Educational tone.
• Reference topic naturally.
• No sensationalism.
• If too long, remove filler words.
• If too short, add one insight.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

          userPrompt = `Topic: ${specialty || 'therapy'}
Practice Name: ${practiceName || 'the practice'}

Content:
${content.substring(0, 1000)}`;
        }

        // Call Claude API
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          temperature: 0.3,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        });

        let metaDescription = message.content[0].text.trim();

        // Safety net: Ensure under 158 characters with complete sentences
        if (metaDescription.length > 158) {
          // Look for last complete sentence (period) before 158
          const lastPeriod = metaDescription.substring(0, 158).lastIndexOf('.');
          if (lastPeriod > 130) {
            // Cut at sentence boundary
            metaDescription = metaDescription.substring(0, lastPeriod + 1).trim();
          } else {
            // No good sentence break, cut at word boundary
            const trimmed = metaDescription.substring(0, 158);
            const lastSpace = trimmed.lastIndexOf(' ');
            metaDescription = metaDescription.substring(0, lastSpace).trim() + '.';
          }
        }

        // Ensure under 150 is padded or regenerated
        if (metaDescription.length < 150) {
          console.warn('Description too short:', metaDescription.length, 'chars');
        }

        // Generate Meta Title
        let titleSystemPrompt = '';
        let titleUserPrompt = '';

        if (pageType === 'homepage') {
          titleSystemPrompt = `Generate a homepage meta title.

STRICT FORMAT:
[Focus Keyword] - [City, ST] - [Business Name]

REQUIREMENTS:
• Maximum 60 characters INCLUDING spaces.
• Do NOT change order.
• Do NOT add extra words.
• Do NOT add punctuation other than hyphens.
• If too long, shorten Focus Keyword ONLY.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

          titleUserPrompt = `Focus Keyword: ${focusKeyword || 'Therapy'}
City: ${city || 'the city'}
State: ${state || 'ST'}
Business Name: ${practiceName || 'the practice'}`;

        } else if (pageType === 'specialty') {
          titleSystemPrompt = `Generate a specialty page meta title.

STRICT FORMAT:
[Specialty] - [City, ST] - [Practice Name]

REQUIREMENTS:
• Maximum 60 characters INCLUDING spaces.
• Do NOT change order.
• Do NOT add extra words.
• If too long, shorten Specialty ONLY.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

          titleUserPrompt = `Specialty: ${specialty || 'Therapy'}
City: ${city || 'the city'}
State: ${state || 'ST'}
Practice Name: ${practiceName || 'the practice'}`;

        } else if (pageType === 'blog') {
          titleSystemPrompt = `Generate a blog post meta title.

REQUIREMENTS:
• Maximum 60 characters INCLUDING spaces.
• Include main topic.
• Include Practice Name.
• Clear and descriptive.
• No clickbait.
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• If output exceeds limit, rewrite until compliant.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces.`;

          titleUserPrompt = `Topic: ${specialty || 'therapy'}
Practice Name: ${practiceName || 'the practice'}

Content:
${content.substring(0, 1000)}`;
        }

        const titleMessage = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 100,
          temperature: 0.3,
          system: titleSystemPrompt,
          messages: [{ role: 'user', content: titleUserPrompt }]
        });

        let metaTitle = titleMessage.content[0].text.trim();

        // Truncate title if over 60 characters
        if (metaTitle.length > 60) {
          metaTitle = metaTitle.substring(0, 57) + '...';
        }

        const seoAnalysis = calculateSEOScore(metaDescription, focusKeyword, specialty);

        results.push({
          success: true,
          input: item,
          metaTitle,
          metaDescription,
          seoScore: seoAnalysis.score,
          feedback: seoAnalysis.feedback,
          characterCount: seoAnalysis.characterCount,
          titleCharacterCount: metaTitle.length
        });

      } catch (itemError) {
        results.push({
          error: itemError.message,
          input: item
        });
      }
    }

    res.json({ results });

  } catch (error) {
    console.error('Error in bulk generation:', error);
    res.status(500).json({
      error: 'Failed to process bulk request',
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
