const fs = require('fs');
const path = require('path');

// Mock types
const QuestionType = {
    SHORT_ANSWER: 'SHORT_ANSWER',
    PARAGRAPH: 'PARAGRAPH',
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
    CHECKBOXES: 'CHECKBOXES',
    DROPDOWN: 'DROPDOWN',
    LINEAR_SCALE: 'LINEAR_SCALE',
    DATE: 'DATE',
    TIME: 'TIME',
    GRID: 'GRID',
    UNKNOWN: 'UNKNOWN'
};

const GOOGLE_TYPE_MAP = {
    0: QuestionType.SHORT_ANSWER,
    1: QuestionType.PARAGRAPH,
    2: QuestionType.MULTIPLE_CHOICE,
    3: QuestionType.DROPDOWN,
    4: QuestionType.CHECKBOXES,
    5: QuestionType.LINEAR_SCALE,
    7: QuestionType.GRID,
    9: QuestionType.DATE,
    10: QuestionType.TIME,
};

const decodeHtmlEntities = (text) => {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
};

const parseGoogleJson = (data, fallbackTitle = '') => {
    let rawTitle = data[1][8];
    if (!rawTitle || rawTitle === 'Untitled Form') {
        if (data[3] && typeof data[3] === 'string') rawTitle = data[3];
    }
    if ((!rawTitle || rawTitle === 'Untitled Form') && fallbackTitle) {
        rawTitle = fallbackTitle;
    }
    const formTitle = rawTitle || 'Untitled Form';
    const rawQuestions = data[1][1];
    const questions = [];
    let currentPageIndex = 0;

    if (!Array.isArray(rawQuestions)) {
        return { title: formTitle, questions: [] };
    }

    rawQuestions.forEach((q) => {
        if (!q) return;
        const typeId = q[3];
        if (typeId === 8) {
            currentPageIndex++;
            return;
        }
        if (!q[1]) return;
        let type = GOOGLE_TYPE_MAP[typeId] || QuestionType.UNKNOWN;
        const title = q[1].trim();
        const required = q[4] && q[4][0] && q[4][0][2] === 1;
        let options = [];
        let rawOptions = [];
        if (Array.isArray(q[4]) && q[4].length > 0 && Array.isArray(q[4][0]) && typeof q[4][0][0] === 'string') {
            rawOptions = q[4];
        } else if (Array.isArray(q[4]) && q[4].length > 0 && Array.isArray(q[4][0]) && Array.isArray(q[4][0][0])) {
            rawOptions = q[4][0];
        } else if (Array.isArray(q[4]) && q[4].length > 0 && q[4][0] && Array.isArray(q[4][0][1])) {
            rawOptions = q[4][0][1];
        }
        if (rawOptions && Array.isArray(rawOptions)) {
            rawOptions.forEach((opt) => {
                if (opt && typeof opt[0] === 'string' && opt[0] !== "") {
                    options.push({ value: opt[0] });
                }
            });
        }
        let entryId = "";
        try {
            if (q[4] && q[4][0] && q[4][0][0]) {
                entryId = q[4][0][0].toString();
            } else {
                entryId = q[0].toString();
            }
        } catch (e) {
            entryId = q[0].toString();
        }
        questions.push({ id: q[0].toString(), entryId, title, type, options, required: !!required, pageIndex: currentPageIndex });
    });
    return { title: formTitle, questions };
};

// Main verification logic
async function verify() {
    console.log("--- Starting Parser Verification ---");
    const htmlPath = path.join(__dirname, 'test_form.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const scriptRegex = /var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+?\])\s*;/s;
    const wizRegex = /window\.WIZ_global_data\s*=\s*(\{.+?\})\s*;/s;

    const match = html.match(scriptRegex);
    const wizMatch = html.match(wizRegex);

    let jsonData = null;
    if (match && match[1]) {
        jsonData = JSON.parse(match[1]);
        console.log("✓ Found FB_PUBLIC_LOAD_DATA_");
    }

    if (!jsonData && wizMatch && wizMatch[1]) {
        const wizData = JSON.parse(wizMatch[1]);
        Object.keys(wizData).forEach(key => {
            const val = wizData[key];
            if (Array.isArray(val) && val.length > 1 && Array.isArray(val[1]) && val[1].length > 1) {
                jsonData = val;
            }
        });
        if (jsonData) console.log("✓ Found data in WIZ_global_data");
    }

    if (!jsonData) {
        console.error("✗ Failed to find form data");
        process.exit(1);
    }

    const { title, questions } = parseGoogleJson(jsonData);
    console.log(`Title: ${title}`);
    console.log(`Questions Parsed: ${questions.length}`);

    questions.forEach((q, i) => {
        console.log(`[${i + 1}] ${q.title} (${q.type}) entryId: ${q.entryId}`);
        if (q.options.length > 0) {
            console.log(`    Options: ${q.options.map(o => o.value).join(', ')}`);
        }
    });

    if (questions.length >= 4) {
        console.log("--- Verification SUCCESS ---");
    } else {
        console.error("--- Verification FAILED: Not enough questions parsed ---");
        process.exit(1);
    }
}

verify().catch(console.error);
