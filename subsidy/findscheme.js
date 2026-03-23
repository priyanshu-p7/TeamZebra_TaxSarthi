const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];
const GEMINI_API_KEY = "AIzaSyAmFu5VKHyXQu1BQ3Ln5VtPC05cawP5Q9M";
const form = document.getElementById('userForm');
const resultDiv = document.getElementById('result');

function getApiErrorMessage(status, data) {
    if (status === 429) {
        return 'Too many requests right now. Please wait a minute and try again.';
    }

    const apiMessage = data?.error?.message;
    return apiMessage || `Request failed (${status}). Please try again.`;
}

function createCard(scheme) {
    return `
        <div class="scheme-card">
            <h3 class="scheme-title">${scheme.name}</h3>
            <div class="scheme-detail">
                <strong>Ministry:</strong> ${scheme.ministry}
            </div>
            <div class="scheme-detail">
                <strong>Description:</strong> ${scheme.description}
            </div>
            <div class="scheme-detail">
                <strong>Benefits:</strong> ${scheme.benefits}
            </div>
            <div class="scheme-detail">
                <strong>Application:</strong> ${scheme.application}
            </div>
            <div class="tags-container">
                ${scheme.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            ${scheme.link ? `<a href="${scheme.link}" target="_blank" class="application-link">Apply Now</a>` : ''}
        </div>
    `;
}

function parseResponse(text) {
    const schemes = [];
    const schemeBlocks = text.split(/(?=\n- Scheme Name:)/g);
    
    for (const block of schemeBlocks) {
        const scheme = {
            name: extractValue(block, 'Scheme Name'),
            ministry: extractValue(block, 'Ministry'),
            description: extractValue(block, 'Description'),
            benefits: extractValue(block, 'Benefits'),
            application: extractValue(block, 'Application Process'),
            tags: extractTags(block),
            link: extractLink(block)
        };
        
        if (scheme.name) schemes.push(scheme);
    }
    
    return schemes;
}

function extractValue(text, field) {
    const regex = new RegExp(`${field}: (.*?)(?=\n-|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : '';
}

function extractTags(text) {
    const tagsMatch = text.match(/Tags: (.*)/);
    return tagsMatch ? tagsMatch[1].split(', ').map(t => t.trim()) : [];
}

function extractLink(text) {
    const linkMatch = text.match(/https?:\/\/[^\s]+/);
    return linkMatch ? linkMatch[0] : null;
}

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    resultDiv.innerHTML = '<div class="loading">Finding suitable schemes...</div>';

    const formData = {
        gender: document.getElementById('gender').value,
        age: document.getElementById('age').value,
        state: document.getElementById('state').value,
        residence: document.getElementById('residence').value,
        caste: document.getElementById('caste').value,
        qualification: document.getElementById('qualification').value,
        income: document.getElementById('income')?.value || '',
        nationality: document.getElementById('nationality')?.value || 'Indian'
    };

    const prompt = `
    User Profile:
- Gender: ${formData.gender}
- Age: ${formData.age}
- Income: ₹${formData.income}
- Nationality: ${formData.nationality}
- State: ${formData.state}
- Residence Type: ${formData.residence}
- Caste Category: ${formData.caste}
- Qualification Level: ${formData.qualification}

Your Task:
1. Recommend ALL government schemes from myscheme.gov.in that this user is ELIGIBLE for.
2. Only include schemes listed on https://www.myscheme.gov.in/ or directly derived from that portal and any other official portal to find eligible scheme provided by government of India.
3. DO NOT include any scheme where the user is not eligible based on the provided information.
4. Apply strict eligibility filters — use age, gender, income, education, caste, residence, and state to determine eligibility.
5. Provide the MAXIMUM number of matching schemes. Be exhaustive.
6. DO NOT provide any irrelevant or random schemes.
7.recomend minimum 10 govenment scheme if possible 

Output Format (Strictly follow this format for each scheme):
---
- Scheme Name: [Exact name of the scheme]
- Ministry: [Ministry or Department name]
- Description: [Short summary (1-2 lines)]
- Benefits: [Key benefits for the user]
- Application Process: [Online/Offline] [Details about how to apply]
- Tags: [Relevant tags — like state-specific, women, SC/ST, student, rural, etc.]
---

Important:
- Refer only to myscheme.gov.in-based schemes.
- Do NOT provide any extra explanation or text. Only show matching schemes in the above format.
`;
    try {
        const response = await fetch(`${API_BASE}/models/${MODEL_CANDIDATES[0]}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{parts: [{text: prompt}]}]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(getApiErrorMessage(response.status, data));
        }

        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            throw new Error('No scheme data was returned by the API. Please try again.');
        }

        const schemes = parseResponse(responseText);
        
        resultDiv.innerHTML = schemes.length > 0 
            ? schemes.map(createCard).join('') 
            : '<p>No schemes found matching your criteria</p>';
        
    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = `<p style="color:red;">${error.message || 'Error fetching schemes. Please try again.'}</p>`;
    }
});



