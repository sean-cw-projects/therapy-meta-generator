import streamlit as st
from anthropic import Anthropic
import os

# Page configuration
st.set_page_config(
    page_title="Therapy Meta Generator",
    page_icon="🧠",
    layout="wide"
)

# Initialize session state
if 'result' not in st.session_state:
    st.session_state.result = None

# Initialize Anthropic client
@st.cache_resource
def get_anthropic_client():
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        st.error("⚠️ ANTHROPIC_API_KEY not found in environment variables")
        st.stop()
    return Anthropic(api_key=api_key)

def calculate_seo_score(meta_description, specialty):
    """Calculate SEO score for the meta description"""
    score = 0
    feedback = []
    length = len(meta_description)

    # Character count (30 points)
    if 150 <= length <= 160:
        score += 30
        feedback.append('✓ Optimal character count (150-160)')
    elif 140 <= length <= 165:
        score += 20
        feedback.append('⚠ Character count acceptable but not optimal')
    else:
        feedback.append(f'✗ Character count outside optimal range ({length} chars)')

    # Focus keyword - give credit automatically (25 points)
    score += 25

    # Specialty mention (20 points)
    if specialty and specialty.strip():
        if specialty.lower() in meta_description.lower():
            score += 20
            feedback.append('✓ Specialty mentioned')
        else:
            score += 10
            feedback.append('⚠ Consider mentioning the specialty')
    else:
        score += 10

    # Call to action (15 points)
    cta_words = ['learn', 'discover', 'find', 'get', 'expert', 'help',
                 'support', 'relief', 'overcome', 'treatment', 'therapy']
    if any(word in meta_description.lower() for word in cta_words):
        score += 15
        feedback.append('✓ Contains action words or value proposition')
    else:
        feedback.append('⚠ Consider adding action words')

    # Uniqueness (10 points)
    generic_phrases = ['click here', 'read more', 'learn more']
    if not any(phrase in meta_description.lower() for phrase in generic_phrases):
        score += 10
        feedback.append('✓ Avoids generic phrases')
    else:
        feedback.append('⚠ Remove generic phrases')

    return min(score, 100), feedback

def generate_meta(page_type, specialty, practice_name, city, state,
                  focus_keyword, blog_title, content):
    """Generate meta title and description using Claude API"""

    client = get_anthropic_client()

    # Build description prompts
    if page_type == "Homepage":
        desc_system = """Generate a homepage meta description.

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
• No trailing spaces."""

        if content and content.strip():
            desc_user = f"""Specialties: Extract from content below.
Practice Name: {practice_name or 'the practice'}
City: {city or 'the city'}

Content:
{content[:1000]}"""
        else:
            desc_user = f"""Generate common therapy specialties list for:
Practice Name: {practice_name or 'the practice'}
City: {city or 'the city'}
Focus Keyword: {focus_keyword or 'therapy'}"""

    elif page_type == "Specialty Page":
        desc_system = """Generate a specialty page meta description.

STRICT STRUCTURE:
• EXACTLY two sentences.
• Sentence 1: Describe the problem related to the specialty.
• Sentence 2: Include Practice Name and how they help.

CHARACTER LIMIT RULES:
• TARGET: 150–158 characters INCLUDING spaces.
• If you must exceed 158 to complete the second sentence, do so BUT:
  - Use the MINIMUM words needed to complete it
  - Keep sentence 2 as concise as possible
  - Do NOT add extra details like "rebuild connection and intimacy"
  - Example of TOO LONG: "...therapy in Los Altos to help rebuild connection and intimacy."
  - Better: "...therapy in Los Altos to restore your relationship."
• ALWAYS include FULL city name and practice name even if it means going slightly over.

REQUIREMENTS:
• Must include all elements:
  - Focus Keyword (naturally integrated)
  - City (FULL city name like "Los Altos" or "San Francisco")
  - Practice Name (USE THE EXACT NAME PROVIDED - not "the practice")
• City placement rules:
  - PREFER "in [City]" (complete as-is): "therapy in Los Altos"
  - If using "for [City]", MUST add "residents" or "clients": "therapy for Nashville residents"
  - NEVER end with just "for [City]." - this is incomplete
• Count characters before returning.

GLOBAL RULES:
• Count characters INCLUDING spaces before returning.
• Do NOT explain reasoning.
• Do NOT use quotation marks.
• Output ONLY the final meta text.
• No extra labels.
• No emojis.
• No trailing spaces."""

        desc_user = f"""Specialty: {specialty or 'Therapy'}
Focus Keyword: {focus_keyword or 'therapy'}
Practice Name: {practice_name or 'the practice'}
City: {city or 'the city'}
State: {state or 'ST'}

CRITICAL: Use the EXACT practice name provided above. Include the FULL city name."""

    else:  # Blog Post
        desc_system = """Generate a blog post meta description.

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
• No trailing spaces."""

        desc_user_parts = []
        if blog_title and blog_title.strip():
            desc_user_parts.append(f"Blog Title: {blog_title}")
        if specialty:
            desc_user_parts.append(f"Related Topic: {specialty}")
        if content and content.strip():
            desc_user_parts.append(f"Content excerpt:\n{content[:800]}")
        else:
            desc_user_parts.append("No content provided")

        desc_user = "\n".join(desc_user_parts) + "\n\nDescribe what this blog post is about based on the title and/or content above (descriptive, not promotional):"

    # Generate description
    desc_message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=200,
        temperature=0.3,
        system=desc_system,
        messages=[{'role': 'user', 'content': desc_user}]
    )

    meta_description = desc_message.content[0].text.strip()

    # Truncate description if over 160 characters - only at sentence boundaries
    if len(meta_description) > 160:
        # Try to cut at last sentence (period) before 160
        last_period = meta_description[:160].rfind('.')
        if last_period > 140:  # Only cut if we have a good sentence boundary
            # Cut at sentence boundary
            meta_description = meta_description[:last_period + 1].strip()
        # Otherwise let it be slightly over - better than cutting mid-phrase

    # Build title prompts
    if page_type == "Homepage":
        title_system = """Generate a homepage meta title.

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
• No trailing spaces."""

        title_user = f"""Focus Keyword: {focus_keyword or 'Therapy'}
City: {city or 'the city'}
State: {state or 'ST'}
Business Name: {practice_name or 'the practice'}"""

    elif page_type == "Specialty Page":
        title_system = """Generate a specialty page meta title.

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
• No trailing spaces."""

        title_user = f"""Specialty: {specialty or 'Therapy'}
City: {city or 'the city'}
State: {state or 'ST'}
Practice Name: {practice_name or 'the practice'}"""

    else:  # Blog Post
        title_system = """Generate a blog post meta title.

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
• No trailing spaces."""

        title_user = f"""Topic: {specialty or 'therapy'}
Practice Name: {practice_name or 'the practice'}

Content:
{content[:1000] if content else 'General mental health blog'}"""

    # Generate title
    title_message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=100,
        temperature=0.3,
        system=title_system,
        messages=[{'role': 'user', 'content': title_user}]
    )

    meta_title = title_message.content[0].text.strip()

    # Truncate title if over 60 characters
    if len(meta_title) > 60:
        meta_title = meta_title[:57] + '...'

    # Calculate costs
    desc_usage = desc_message.usage
    title_usage = title_message.usage
    total_input = desc_usage.input_tokens + title_usage.input_tokens
    total_output = desc_usage.output_tokens + title_usage.output_tokens
    input_cost = (total_input / 1000000) * 3
    output_cost = (total_output / 1000000) * 15
    total_cost = input_cost + output_cost

    # Calculate SEO score
    score, feedback = calculate_seo_score(meta_description, specialty)

    return {
        'meta_title': meta_title,
        'meta_description': meta_description,
        'score': score,
        'feedback': feedback,
        'cost': total_cost,
        'input_tokens': total_input,
        'output_tokens': total_output
    }

# Custom CSS for better styling
st.markdown("""
<style>
    /* Main container */
    .main {
        background-color: #f8f9fa;
    }

    /* Form styling */
    .stForm {
        background-color: white;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Input fields */
    .stTextInput input, .stTextArea textarea {
        border-radius: 5px;
        border: 1px solid #e0e0e0;
    }

    /* Buttons */
    .stButton button {
        border-radius: 5px;
        font-weight: 600;
    }

    /* Results section */
    .results-container {
        background-color: white;
        padding: 1.5rem;
        border-radius: 10px;
        margin-top: 2rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Code blocks */
    code {
        background-color: #f5f5f5;
        padding: 0.5rem;
        border-radius: 5px;
        border-left: 3px solid #10b981;
    }

    /* Headers */
    h1 {
        color: #1f2937;
        font-weight: 700;
    }

    h3 {
        color: #374151;
        font-weight: 600;
        margin-top: 1rem;
    }

    /* Success/warning boxes */
    .stSuccess, .stWarning, .stError, .stInfo {
        border-radius: 5px;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.title("🧠 Therapy Meta Description Generator")
st.markdown("Generate SEO-optimized meta descriptions and titles for therapy websites")

# Page Type - OUTSIDE form so it updates dynamically
page_type = st.selectbox(
    "Page Type",
    ["Homepage", "Specialty Page", "Blog Post"],
    help="Select the type of page you're creating meta tags for"
)

# Main form
with st.form("meta_generator_form"):
    col1, col2 = st.columns(2)

    with col1:
        # Specialty/Topic field (label changes based on page type)
        if page_type == "Homepage":
            specialty_label = "Practice Name (Optional)"
            specialty_help = "e.g., Serenity Counseling Center, Mindful Therapy Group"
        elif page_type == "Specialty Page":
            specialty_label = "Specialty Name (Optional)"
            specialty_help = "e.g., Anxiety Therapy, EMDR, Depression Counseling"
        else:
            specialty_label = "Related Specialty (Optional)"
            specialty_help = "e.g., Anxiety, Depression, Trauma"

        specialty = st.text_input(specialty_label, help=specialty_help)

        practice_name = st.text_input(
            "Practice/Business Name (Optional)",
            help="e.g., Kaleidoscope Counseling, Serenity Therapy Center"
        )

        city = st.text_input(
            "City (Optional)",
            help="e.g., Denver, Seattle, Nashville"
        )

    with col2:
        state = st.text_input(
            "State (Optional)",
            help="e.g., CO, WA, TN"
        )

        focus_keyword = st.text_input(
            "Focus Keyword (Optional)",
            help="e.g., anxiety therapist Seattle, EMDR therapy near me"
        )

        # Blog title field (only for blog posts)
        if page_type == "Blog Post":
            blog_title = st.text_input(
                "Blog Post Title",
                help="e.g., Understanding Anxiety: Signs and Coping Strategies"
            )
        else:
            blog_title = ""

    # Content field with dynamic label
    content_label = {
        "Homepage": "Homepage Content (Optional - Should not be needed)",
        "Specialty Page": "Specialty Page Content (Optional - Should not be needed)",
        "Blog Post": "Blog Content (Optional - Should not be needed)"
    }

    content = st.text_area(
        content_label[page_type],
        height=150,
        help="Paste content here if needed (optional)"
    )

    # Submit buttons
    col1, col2 = st.columns([1, 5])
    with col1:
        submitted = st.form_submit_button("Generate", type="primary", use_container_width=True)
    with col2:
        clear = st.form_submit_button("Clear", use_container_width=True)

# Handle form submission
if submitted:
    with st.spinner("Generating meta tags..."):
        try:
            result = generate_meta(
                page_type, specialty, practice_name, city, state,
                focus_keyword, blog_title, content
            )
            st.session_state.result = result
        except Exception as e:
            st.error(f"Error generating meta tags: {str(e)}")
            st.session_state.result = None

if clear:
    st.session_state.result = None
    st.rerun()

# Display results
if st.session_state.result:
    st.markdown("---")
    st.subheader("📊 Results")

    result = st.session_state.result

    # Meta Title
    st.markdown("### Meta Title")
    title_col1, title_col2 = st.columns([4, 1])
    with title_col1:
        st.code(result['meta_title'], language=None)
    with title_col2:
        title_len = len(result['meta_title'])
        if title_len <= 60:
            st.success(f"{title_len} chars ✓")
        else:
            st.warning(f"{title_len} chars")

    # Meta Description
    st.markdown("### Meta Description")
    desc_col1, desc_col2 = st.columns([4, 1])
    with desc_col1:
        st.code(result['meta_description'], language=None)
    with desc_col2:
        desc_len = len(result['meta_description'])
        if 150 <= desc_len <= 160:
            st.success(f"{desc_len} chars ✓")
        elif 140 <= desc_len <= 165:
            st.warning(f"{desc_len} chars")
        else:
            st.error(f"{desc_len} chars")

    # SEO Score
    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("### SEO Score")
        score = result['score']
        if score >= 80:
            st.success(f"**{score}/100** 🎯")
        elif score >= 60:
            st.warning(f"**{score}/100** ⚠️")
        else:
            st.error(f"**{score}/100** ❌")

    with col2:
        st.markdown("### Cost")
        st.info(f"**${result['cost']:.6f}**")
        st.caption(f"Input: {result['input_tokens']} | Output: {result['output_tokens']}")

    with col3:
        st.markdown("### Actions")
        if st.button("📋 Copy Title", use_container_width=True):
            st.code(result['meta_title'], language=None)
            st.success("Title ready to copy!")
        if st.button("📋 Copy Description", use_container_width=True):
            st.code(result['meta_description'], language=None)
            st.success("Description ready to copy!")

    # Feedback
    if result['feedback']:
        with st.expander("📝 SEO Feedback", expanded=False):
            for item in result['feedback']:
                st.markdown(f"- {item}")

# Footer
st.markdown("---")
st.caption("🤖 Generated with Claude Sonnet 4.5")
