# Therapy Meta Description Generator

A web application for generating SEO-optimized meta descriptions for therapy websites, including specialty pages and blog posts.

## Features

- **Two Page Types**: Generate meta descriptions for specialty pages or blog posts
- **Claude API Integration**: Uses Anthropic's Claude AI for intelligent, context-aware generation
- **SEO Scoring**: Real-time SEO score with actionable feedback
- **Character Count Validation**: Visual indicators for optimal length (150-160 characters)
- **Specialty Detection**: Automatically optimizes based on therapy specialty
- **Copy to Clipboard**: One-click copying of generated descriptions
- **Optional Fields**: Flexible input with specialty name, focus keyword, and content

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js with Express
- **AI**: Claude API (Anthropic)
- **Styling**: Custom CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Installation

### 1. Clone or navigate to the project directory

```bash
cd therapy-meta-generator
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Install client dependencies

```bash
cd ../client
npm install
```

### 4. Set up environment variables

Create a `.env` file in the `server` directory:

```bash
cd ../server
cp .env.example .env
```

Edit the `.env` file and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_actual_api_key_here
PORT=5000
```

## Running the Application

### Start the backend server (from the server directory)

```bash
cd server
npm run dev
```

The server will run on `http://localhost:5000`

### Start the frontend (from the client directory, in a new terminal)

```bash
cd client
npm start
```

The React app will run on `http://localhost:3000`

## Usage

### For Specialty Pages

1. Select "Specialty Page" as the page type
2. (Optional) Enter the specialty name (e.g., "Anxiety Therapy", "EMDR")
3. (Optional) Enter a focus keyword (e.g., "anxiety therapist Seattle")
4. Paste your specialty page content
5. Click "Generate Meta Description"

### For Blog Posts

1. Select "Blog Post" as the page type
2. (Optional) Enter the related specialty (e.g., "Anxiety", "Depression")
3. (Optional) Enter a focus keyword
4. Paste your blog post content
5. Click "Generate Meta Description"

## SEO Scoring Criteria

The tool evaluates meta descriptions based on:

- **Character Count** (30 points): Optimal length is 150-160 characters
- **Focus Keyword Inclusion** (25 points): Focus keyword appears in the description
- **Specialty Mention** (20 points): Specialty is naturally included
- **Call to Action** (15 points): Contains action words or value propositions
- **Uniqueness** (10 points): Avoids generic phrases like "click here"

## API Endpoints

### POST `/api/generate`

Generate a single meta description.

**Request Body:**
```json
{
  "pageType": "specialty" | "blog",
  "specialty": "Anxiety Therapy",
  "focusKeyword": "anxiety therapist Seattle",
  "content": "Your page content here..."
}
```

**Response:**
```json
{
  "metaDescription": "Generated description...",
  "seoScore": 85,
  "feedback": ["✓ Optimal length", "✓ Focus keyword included"],
  "characterCount": 157
}
```

### POST `/api/generate-bulk`

Generate multiple meta descriptions (max 10 per request).

**Request Body:**
```json
{
  "items": [
    {
      "pageType": "specialty",
      "specialty": "Anxiety Therapy",
      "focusKeyword": "anxiety therapy",
      "content": "Content here..."
    },
    {
      "pageType": "blog",
      "specialty": "Depression",
      "content": "Blog content here..."
    }
  ]
}
```

## Project Structure

```
therapy-meta-generator/
├── client/                 # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── server.js          # Express server & Claude API integration
│   ├── .env.example       # Environment variables template
│   └── package.json
└── README.md
```

## Customization

### Adjusting Prompts

Edit the `systemPrompt` variables in [server/server.js](server/server.js) to customize how Claude generates meta descriptions for specialty pages vs blog posts.

### Modifying SEO Scoring

The `calculateSEOScore` function in [server/server.js](server/server.js) can be adjusted to change scoring criteria and weights.

### Styling

Modify [client/src/App.css](client/src/App.css) to change the visual appearance of the application.

## Tips for Best Results

1. **Provide detailed content**: The more context you give, the better the generated description
2. **Use specific keywords**: Include location, specialty, and target audience in your focus keyword
3. **Review and edit**: Treat generated descriptions as a starting point and refine as needed
4. **Test variations**: Generate multiple times with slightly different inputs to compare results
5. **Consider your audience**: Specialty pages should be more conversion-focused, blogs more educational

## Troubleshooting

### "Failed to generate meta description" Error

- Check that your Anthropic API key is correctly set in the `.env` file
- Ensure you have API credits available
- Verify your internet connection

### Server Not Starting

- Make sure port 5000 is not already in use
- Check that all dependencies are installed with `npm install`
- Verify your Node.js version is 14 or higher

### React App Not Loading

- Ensure the backend server is running first
- Check that the proxy setting in `client/package.json` points to the correct server URL
- Clear your browser cache and reload

## Future Enhancements

Potential features for future versions:

- Bulk CSV import/export
- Save and manage generated descriptions
- User authentication and team management
- A/B testing suggestions
- Integration with Google Search Console
- Multi-language support
- Custom prompt templates
- Performance analytics

## License

This project is for internal agency use.

## Support

For questions or issues, contact your development team.
