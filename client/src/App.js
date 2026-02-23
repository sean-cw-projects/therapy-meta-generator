import React, { useState } from 'react';
import './App.css';

function App() {
  const [pageType, setPageType] = useState('specialty');
  const [specialty, setSpecialty] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setResult(null);

    // Content is now optional for all page types
    setLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageType,
          specialty: specialty.trim(),
          practiceName: practiceName.trim(),
          city: city.trim(),
          state: state.trim(),
          focusKeyword: focusKeyword.trim(),
          blogTitle: blogTitle.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meta description');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (result?.metaDescription) {
      navigator.clipboard.writeText(result.metaDescription);
      alert('Meta description copied to clipboard!');
    }
  };

  const handleClear = () => {
    setSpecialty('');
    setPracticeName('');
    setCity('');
    setState('');
    setFocusKeyword('');
    setBlogTitle('');
    setContent('');
    setResult(null);
    setError('');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getCharCountColor = (count) => {
    if (count >= 150 && count <= 160) return '#10b981';
    if (count >= 140 && count <= 165) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🧠 Therapy Meta Description Generator</h1>
          <p>Generate SEO-optimized meta descriptions for therapy websites</p>
        </header>

        <div className="main-content">
          <div className="form-section">
            <div className="page-type-selector">
              <label>Page Type:</label>
              <div className="radio-group">
                <label className={`radio-option ${pageType === 'homepage' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    value="homepage"
                    checked={pageType === 'homepage'}
                    onChange={(e) => setPageType(e.target.value)}
                  />
                  <span>Homepage</span>
                </label>
                <label className={`radio-option ${pageType === 'specialty' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    value="specialty"
                    checked={pageType === 'specialty'}
                    onChange={(e) => setPageType(e.target.value)}
                  />
                  <span>Specialty Page</span>
                </label>
                <label className={`radio-option ${pageType === 'blog' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    value="blog"
                    checked={pageType === 'blog'}
                    onChange={(e) => setPageType(e.target.value)}
                  />
                  <span>Blog Post</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="specialty">
                {pageType === 'homepage'
                  ? 'Practice Name'
                  : pageType === 'specialty'
                  ? 'Specialty Name'
                  : 'Related Specialty'} (Optional)
              </label>
              <input
                type="text"
                id="specialty"
                placeholder={
                  pageType === 'homepage'
                    ? 'e.g., Serenity Counseling Center, Mindful Therapy Group'
                    : pageType === 'specialty'
                    ? 'e.g., Anxiety Therapy, EMDR, Depression Counseling'
                    : 'e.g., Anxiety, Depression, Trauma'
                }
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="practiceName">Practice/Business Name (Optional)</label>
              <input
                type="text"
                id="practiceName"
                placeholder="e.g., Kaleidoscope Counseling, Serenity Therapy Center"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City (Optional)</label>
              <input
                type="text"
                id="city"
                placeholder="e.g., Denver, Seattle, Nashville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State (Optional)</label>
              <input
                type="text"
                id="state"
                placeholder="e.g., CO, WA, TN"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="focusKeyword">Focus Keyword (Optional)</label>
              <input
                type="text"
                id="focusKeyword"
                placeholder={
                  pageType === 'homepage'
                    ? 'e.g., therapist near me, counseling services Seattle'
                    : 'e.g., anxiety therapist Seattle, EMDR therapy near me'
                }
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                className="input-field"
              />
            </div>

            {pageType === 'blog' && (
              <div className="form-group">
                <label htmlFor="blogTitle">Blog Post Title</label>
                <input
                  type="text"
                  id="blogTitle"
                  placeholder="e.g., Understanding Anxiety: Signs and Coping Strategies"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="content">
                {pageType === 'homepage'
                  ? 'Homepage'
                  : pageType === 'specialty'
                  ? 'Specialty Page'
                  : 'Blog'} Content (Optional - Should not be needed)
              </label>
              <textarea
                id="content"
                placeholder={
                  pageType === 'homepage'
                    ? 'Paste your homepage content here... (optional)'
                    : pageType === 'specialty'
                    ? 'Paste your specialty page content here... (optional)'
                    : 'Paste your blog post content here... (optional)'
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="textarea-field"
                rows="10"
              />
            </div>

            <div className="button-group">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Generating...' : 'Generate Meta Description'}
              </button>
              <button onClick={handleClear} className="btn btn-secondary">
                Clear
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          {result && (
            <div className="result-section">
              <h2>Generated Meta Tags</h2>

              <div className="meta-section">
                <h3>Meta Title</h3>
                <div className="meta-box">
                  <p className="meta-text">{result.metaTitle}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.metaTitle);
                      alert('Meta title copied to clipboard!');
                    }}
                    className="btn-copy"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="meta-info">
                  <span className="char-count" style={{ color: result.titleCharacterCount <= 60 ? '#10b981' : '#ef4444' }}>
                    {result.titleCharacterCount} characters
                  </span>
                  <span className="char-hint">Optimal: 50-60</span>
                </div>
              </div>

              <div className="meta-section">
                <h3>Meta Description</h3>
                <div className="meta-box">
                  <p className="meta-text">{result.metaDescription}</p>
                  <button onClick={handleCopyToClipboard} className="btn-copy">
                    📋 Copy
                  </button>
                </div>
                <div className="meta-info">
                  <span className="char-count" style={{ color: getCharCountColor(result.characterCount) }}>
                    {result.characterCount} characters
                  </span>
                  <span className="char-hint">Optimal: 150-158</span>
                </div>
              </div>

              <div className="seo-score-section">
                <h3>SEO Score</h3>
                <div className="score-display">
                  <div
                    className="score-value"
                    style={{ color: getScoreColor(result.seoScore) }}
                  >
                    {result.seoScore}/100
                  </div>
                  <div className="score-hint">
                    {result.seoScore >= 80
                      ? '🎉 Excellent!'
                      : result.seoScore >= 60
                      ? '👍 Good'
                      : '⚠️ Needs work'}
                  </div>
                </div>
              </div>

              <div className="feedback-section">
                <h3>SEO Feedback</h3>
                <ul className="feedback-list">
                  {result.feedback.map((item, index) => (
                    <li key={index} className={item.startsWith('✓') ? 'positive' : item.startsWith('✗') ? 'negative' : 'warning'}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {result.cost && (
                <div className="cost-section">
                  <h3>Generation Cost</h3>
                  <div className="cost-details">
                    <div className="cost-item">
                      <span className="cost-label">Input Tokens:</span>
                      <span className="cost-value">{result.cost.inputTokens.toLocaleString()}</span>
                    </div>
                    <div className="cost-item">
                      <span className="cost-label">Output Tokens:</span>
                      <span className="cost-value">{result.cost.outputTokens.toLocaleString()}</span>
                    </div>
                    <div className="cost-item total">
                      <span className="cost-label">Total Cost:</span>
                      <span className="cost-value">${result.cost.totalCost} ({result.cost.costInCents}¢)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
