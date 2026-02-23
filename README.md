# 🧠 Therapy Meta Description Generator

Generate SEO-optimized meta descriptions and titles for therapy websites using AI.

## Features

- **Three Page Types**: Homepage, Specialty Pages, and Blog Posts
- **Structured Input**: Practice name, city, state, focus keywords
- **AI-Powered**: Uses Claude Sonnet 4.5 for intelligent generation
- **SEO Scoring**: Real-time feedback on meta description quality
- **Cost Tracking**: Monitor API usage costs
- **Smart Formulas**: Follows strict SEO best practices

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up your API key**:
   Create `.streamlit/secrets.toml`:
   ```toml
   ANTHROPIC_API_KEY = "your-api-key-here"
   ```

3. **Run the app**:
   ```bash
   streamlit run streamlit_app.py
   ```

## Deployment to Streamlit Cloud

### Step 1: Push to GitHub

1. Create a new repository on GitHub: https://github.com/new
   - Name: `therapy-meta-generator`
   - Make it Public

2. Push your code:
   ```bash
   git add .
   git commit -m "Add Streamlit app"
   git remote add origin https://github.com/sean-cw-projects/therapy-meta-generator.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Streamlit Cloud

1. Go to https://share.streamlit.io/
2. Click **"New app"**
3. Select your GitHub repo: `sean-cw-projects/therapy-meta-generator`
4. Main file path: `streamlit_app.py`
5. **Add Secret**:
   - Go to Advanced settings
   - Add secret: `ANTHROPIC_API_KEY = "your-api-key"`
6. Click **Deploy**!

Your app will be live at: `https://therapy-meta-generator.streamlit.app`

## Usage

### Specialty Pages
- Enter specialty, practice name, city, state
- No content needed - uses structured variables only
- Generates empathetic, conversion-focused meta

### Homepage
- Enter practice name, city, keywords
- Auto-generates specialty list or extracts from content
- Creates comma-separated meta descriptions

### Blog Posts
- Enter blog title and optional content
- Generates descriptive (not promotional) meta
- Focuses on what the blog post covers

## Updating After Feedback

Making changes is easy:

1. Edit `streamlit_app.py`
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update based on feedback"
   git push
   ```
3. Streamlit auto-deploys in ~1 minute!

## API Costs

- Model: Claude Sonnet 4.5
- Pricing: $3/M input tokens, $15/M output tokens
- Typical cost per generation: $0.001-0.003

## Tech Stack

- **Frontend**: Streamlit (Python)
- **AI**: Anthropic Claude API
- **Deployment**: Streamlit Cloud

## License

MIT

---

🤖 Built with Claude Sonnet 4.5
