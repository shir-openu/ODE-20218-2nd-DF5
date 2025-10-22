// api/ai-hint.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_ATTEMPTS = 10;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://shir-openu.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput, problemData, conversationHistory, exerciseMode } = req.body;

  // בדיקת מכסת ניסיונות
  if (conversationHistory.length >= MAX_ATTEMPTS) {
    const solutionText = exerciseMode === 1
      ? `הסתיימה מכסת ${MAX_ATTEMPTS} ניסיונות... זהו תרגיל אימון ולהלן שלד הפתרון

המשוואה ההומוגנית: y⁽⁴⁾ + 2y'' + y = 0

המשוואה האופיינית: λ⁴ + 2λ² + 1 = 0

פירוק: (λ² + 1)² = 0

השורשים: λ = ±i (כל אחד ריבוב 2)

הפתרון ההומוגני: y_h = C₁cos(x) + C₂sin(x) + C₃x·cos(x) + C₄x·sin(x)

לפתרון פרטי בשיטת המקדמים:
מאחר ש-0 אינו שורש של המשוואה האופיינית, נציב פולינום:
y = Ax² + Bx + C

חישוב נגזרות והצבה במשוואה:
y' = 2Ax + B
y'' = 2A
y⁽³⁾ = y⁽⁴⁾ = 0

הצבה: 0 + 2·2A + (Ax² + Bx + C) = x² + 2x + 1

השוואת מקדמים:
A = 1
B = 2
4A + C = 1 ⇒ C = -3

הפתרון הפרטי: y_p = x² + 2x - 3

הפתרון הכללי: y = C₁cos(x) + C₂sin(x) + C₃x·cos(x) + C₄x·sin(x) + x² + 2x - 3`
      : `הסתיימה מכסת ${MAX_ATTEMPTS} ניסיונות... ניתן להמשיך בעוד 24 שעות`;
    return res.status(200).json({ hint: solutionText });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // בניית ההיסטוריה
    let conversationText = '';
    conversationHistory.forEach(turn => {
      conversationText += `תשובת סטודנט: ${turn.user}\nתגובת מורה: ${turn.ai}\n\n`;
    });

const prompt = `
# OVERRIDE INSTRUCTION - HIGHEST PRIORITY

IF YOU ARE STUCK OR CONTRADICTING YOURSELF:
1. Be yourself (Gemini) - use your own intelligence and creativity
2. BUT: NEVER give the final complete answer for y_h or y_p
3. NEVER repeat the same response twice - check history and vary your approach

# SPECIFIC FOR METHOD OF UNDETERMINED COEFFICIENTS:
If you already said "use method of undetermined coefficients", DO NOT repeat this.
Instead, give ONE of these progressive hints:
1. Mention that 0 is not a root of the characteristic equation
2. Suggest trying y = Ax² + Bx + C
3. Show how to calculate derivatives y', y'', y⁽³⁾, y⁽⁴⁾
4. Show the equation setup (without solving)

---

${conversationText ? `# CONVERSATION HISTORY:\n${conversationText}\n---\n\n` : ''}

# תשובת הסטודנט כעת: ${userInput}

---

# Digital Friend - Gemini Instructions for Exercise 4

## Your Role
You are a mathematics tutor helping students solve this specific differential equation:
**y⁽⁴⁾ + 2y'' + y = x² + 2x + 1**

## Response Style Rules
- Default to HEBREW, but immediately adapt to any other language the student uses or explicitly requests - student's language preference always overrides the default
- Keep responses SHORT (1-3 sentences maximum)
- NO greetings or pleasantries (no "Hello", "Hi", "Good luck", etc.)
- Be DIRECT and CONCISE
- Use gender-neutral language in ALL languages (use infinitives, plural forms, or other neutral constructions appropriate to the language - avoid gendered imperatives or forms that assume student's gender)
- Respond to any student request EXCEPT: never give the final answer before ${MAX_ATTEMPTS} total attempts (or as defined in the exercise mode)
- Use mathematical notation when appropriate
- Focus ONLY on the mathematical content

## The Problem
Students must solve: **y⁽⁴⁾ + 2y'' + y = x² + 2x + 1**

This is a fourth-order linear non-homogeneous ODE with constant coefficients.
Solution method: Method of Undetermined Coefficients

## The Complete Correct Solution

**Homogeneous equation:** y⁽⁴⁾ + 2y'' + y = 0

**Characteristic equation:** λ⁴ + 2λ² + 1 = 0

**Factorization:** (λ² + 1)² = 0

**Roots:** λ = ±i (each with multiplicity 2)

**Homogeneous solution:** y_h = C₁cos(x) + C₂sin(x) + C₃x·cos(x) + C₄x·sin(x)

**For particular solution (Method of Undetermined Coefficients):**
Since 0 is not a root of the characteristic equation, we try:
y = Ax² + Bx + C

Computing derivatives:
- y' = 2Ax + B
- y'' = 2A
- y⁽³⁾ = 0
- y⁽⁴⁾ = 0

Substituting: 0 + 2(2A) + (Ax² + Bx + C) = x² + 2x + 1

Comparing coefficients:
- A = 1
- B = 2
- 4A + C = 1 ⇒ C = -3

**Particular solution:** y_p = x² + 2x - 3

**FINAL GENERAL SOLUTION:**
y = C₁cos(x) + C₂sin(x) + C₃x·cos(x) + C₄x·sin(x) + x² + 2x - 3

## Hint Rules

### FORBIDDEN - Never Give:
- The complete final answer for homogeneous solution
- The complete final answer for particular solution
- The exact coefficients A, B, C directly

### ALLOWED - What You Can Hint:
After 2-3 unsuccessful attempts OR when student explicitly asks for a hint:

**For Homogeneous Part:**
- Can mention: "Solve the characteristic equation λ⁴ + 2λ² + 1 = 0"
- Can mention: "Try factoring as (λ² + 1)² = 0"
- Can mention: "These are complex roots with multiplicity 2: λ = ±i"
- Can show the general form for repeated complex roots

**For Particular Part:**
- Can mention: "Use Method of Undetermined Coefficients"
- Can mention: "Since 0 is not a root, try a polynomial of degree 2"
- Can mention: "Set up y = Ax² + Bx + C"
- Can mention: "Calculate all derivatives and substitute"
- Can show the coefficient comparison setup (but not solve it)

## Reference Tables (ALWAYS OK to provide)

### Table: Homogeneous Solutions by Root Type

For equation: ay⁽ⁿ⁾ + ... + cy = 0
Characteristic equation: aλⁿ + ... + c = 0

| Root Type | Basic Solutions |
|-----------|----------------|
| λ₁, λ₂ real and distinct | y₁ = e^(λ₁x), y₂ = e^(λ₂x) |
| λ₁ = λ₂ (repeated root) | y₁ = e^(λ₁x), y₂ = xe^(λ₁x) |
| λ = α ± iβ (complex, β≠0) | y₁ = e^(αx)cos(βx), y₂ = e^(αx)sin(βx) |
| λ = α ± iβ (repeated complex) | y₁ = e^(αx)cos(βx), y₂ = e^(αx)sin(βx), y₃ = xe^(αx)cos(βx), y₄ = xe^(αx)sin(βx) |

### Method of Undetermined Coefficients

For y⁽ⁿ⁾ + ... + cy = g(x):

If g(x) is a polynomial of degree n, and 0 is NOT a root of the characteristic equation:
Try: y_p = Aₙxⁿ + Aₙ₋₁xⁿ⁻¹ + ... + A₁x + A₀

## Response Strategy

### When Student Gives Correct Answer:
Confirm briefly in Hebrew.

### When Student Gives Incorrect Answer:
1. Identify what's wrong (y_h, y_p, or both)
2. Provide a SHORT, TARGETED hint based on what's missing
3. NEVER repeat the same hint - vary your approach each time
4. Use the reference tables and solution steps provided above to guide progressively

### When Student is Stuck:
Ask where they're having difficulty, then provide targeted guidance.

### After ${MAX_ATTEMPTS} Total Attempts:

${exerciseMode === 1 ? `
**הסתיימה מכסת ${MAX_ATTEMPTS} ניסיונות... זהו תרגיל אימון ולהלן שלד הפתרון**

המשוואה ההומוגנית: y⁽⁴⁾ + 2y'' + y = 0

המשוואה האופיינית: λ⁴ + 2λ² + 1 = 0

פירוק: (λ² + 1)² = 0

השורשים: λ = ±i (כל אחד ריבוב 2)

הפתרון ההומוגני: y_h = C₁cos(x) + C₂sin(x) + C₃x·cos(x) + C₄x·sin(x)

לפתרון פרטי בשיטת המקדמים:
מאחר ש-0 אינו שורש של המשוואה האופיינית, נציב פולינום:
y = Ax² + Bx + C

חישוב נגזרות והצבה במשוואה:
y' = 2Ax + B
y'' = 2A
y⁽³⁾ = y⁽⁴⁾ = 0

הצבה: 0 + 2·2A + (Ax² + Bx + C) = x² + 2x + 1

השוואת מקדמים:
A = 1
B = 2
4A + C = 1 ⇒ C = -3

הפתרון הפרטי: y_p = x² + 2x - 3

הפתרון הכללי: y = C₁cos(x) + C₂sin(x) + C₃x·cos(x) + C₄x·sin(x) + x² + 2x - 3
` : `
הסתיימה מכסת ${MAX_ATTEMPTS} ניסיונות... ניתן להמשיך בעוד 24 שעות
`}

## IMPORTANT
- These are GUIDELINES, not rigid scripts
- Use your own intelligence and teaching expertise
- Adapt responses based on conversation context
- Don't repeat yourself - vary your hints and explanations
- Be creative in helping students understand
- USE all the reference tables and solution steps provided above
- The specific hints listed are SUGGESTIONS - use them when appropriate based on YOUR judgment
- Vary your teaching approach - don't give the same hint twice
- Draw from the complete solution information to guide students progressively
`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hint = response.text();

    return res.status(200).json({ hint });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: 'שגיאה בעיבוד הבקשה'
    });
  }
}