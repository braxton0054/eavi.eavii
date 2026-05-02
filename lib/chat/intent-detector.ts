export type IntentType = 
  | 'fee_balance'
  | 'student_record'
  | 'course_info'
  | 'application_status'
  | 'lecturer_info'
  | 'payment_history'
  | 'database_health'
  | 'unknown';

export interface IntentResult {
  intent: IntentType;
  entities: Record<string, any>;
  confidence: number;
}

const intentPatterns: Record<IntentType, { patterns: RegExp[]; entityPatterns?: RegExp[] }> = {
  fee_balance: {
    patterns: [
      /fee\s*balance/i,
      /payment\s*status/i,
      /how\s+much\s+(paid|owed|remaining)/i,
      /balance/i,
      /total\s+fee/i,
    ],
    entityPatterns: [
      /(?:student\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /(?:id\s*:?\s*)([A-Z0-9]+)/i,
    ],
  },
  student_record: {
    patterns: [
      /student\s*record/i,
      /student\s*info/i,
      /student\s*details/i,
      /find\s+student/i,
      /look\s+up\s+student/i,
    ],
    entityPatterns: [
      /(?:student\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /(?:id\s*:?\s*)([A-Z0-9]+)/i,
    ],
  },
  course_info: {
    patterns: [
      /course\s*info/i,
      /course\s*details/i,
      /what\s+courses?/i,
      /available\s+courses/i,
    ],
  },
  application_status: {
    patterns: [
      /application\s*status/i,
      /application\s*info/i,
      /pending\s+application/i,
      /enrollment\s*status/i,
    ],
  },
  lecturer_info: {
    patterns: [
      /lecturer\s*info/i,
      /lecturer\s*details/i,
      /find\s+lecturer/i,
      /instructor/i,
    ],
  },
  payment_history: {
    patterns: [
      /payment\s*history/i,
      /past\s+payments/i,
      /installment/i,
    ],
  },
  database_health: {
    patterns: [
      /database\s*health/i,
      /system\s*status/i,
      /check\s+(db|database)/i,
      /row\s*count/i,
      /index/i,
    ],
  },
  unknown: {
    patterns: [],
  },
};

export function detectIntent(message: string): IntentResult {
  const lowerMessage = message.toLowerCase();
  let bestMatch: IntentResult = { intent: 'unknown', entities: {}, confidence: 0 };

  for (const [intent, { patterns, entityPatterns }] of Object.entries(intentPatterns)) {
    if (intent === 'unknown') continue;

    const confidence = patterns.reduce((score, pattern) => {
      return lowerMessage.match(pattern) ? score + 1 : score;
    }, 0);

    if (confidence > bestMatch.confidence) {
      const entities: Record<string, any> = {};
      let limit = 5;

      // Extract entities based on entity patterns
      if (entityPatterns) {
        for (const ep of entityPatterns) {
          const match = message.match(ep);
          if (match) {
            if (ep.source.includes('student') || ep.source.includes('name')) {
              entities.name = match[1];
            } else if (match[1] && match[1].length > 2) {
              entities.id = match[1];
            }
          }
        }
      }

      // Default limit based on intent
      if (intent === 'fee_balance' || intent === 'student_record') {
        limit = 1;
      } else if (intent === 'course_info' || intent === 'lecturer_info') {
        limit = 10;
      }

      entities.limit = limit;

      bestMatch = {
        intent: intent as IntentType,
        entities,
        confidence: confidence / patterns.length,
      };
    }
  }

  // If no specific intent matches, default to student query for school-related queries
  if (bestMatch.intent === 'unknown' && lowerMessage.length > 0) {
    const schoolKeywords = ['student', 'fee', 'course', 'class', 'lecturer', 'application', 'payment'];
    const hasSchoolKeyword = schoolKeywords.some(kw => lowerMessage.includes(kw));
    
    if (hasSchoolKeyword) {
      bestMatch = {
        intent: 'student_record',
        entities: { limit: 5 },
        confidence: 0.3,
      };
    }
  }

  return bestMatch;
}