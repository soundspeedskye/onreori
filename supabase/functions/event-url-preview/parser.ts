import type {EventUrlPreview} from './types.ts';

function decodeHtmlEntity(value: string) {
  return value
    .split('&amp;')
    .join('&')
    .split('&apos;')
    .join("'")
    .split('&gt;')
    .join('>')
    .split('&lt;')
    .join('<')
    .split('&nbsp;')
    .join(' ')
    .split('&quot;')
    .join('"');
}

function normalizeWhitespace(value: string) {
  let normalized = '';
  let previousWasSpace = false;

  for (const char of decodeHtmlEntity(value)) {
    const code = char.charCodeAt(0);
    const isSpace = code <= 32 || code === 160;

    if (isSpace) {
      if (!previousWasSpace) {
        normalized += ' ';
      }
      previousWasSpace = true;
    } else {
      normalized += char;
      previousWasSpace = false;
    }
  }

  return normalized.trim();
}

function readAttribute(tag: string, attributeName: string) {
  let index = 0;
  const targetName = attributeName.toLowerCase();

  while (index < tag.length) {
    while (index < tag.length && tag.charCodeAt(index) <= 32) {
      index += 1;
    }

    const nameStart = index;
    while (
      index < tag.length &&
      tag[index] !== '=' &&
      tag.charCodeAt(index) > 32 &&
      tag[index] !== '>'
    ) {
      index += 1;
    }

    const name = tag.slice(nameStart, index).toLowerCase();
    while (index < tag.length && tag.charCodeAt(index) <= 32) {
      index += 1;
    }

    if (tag[index] !== '=') {
      if (tag[index] === '>') {
        break;
      }
      continue;
    }

    index += 1;
    while (index < tag.length && tag.charCodeAt(index) <= 32) {
      index += 1;
    }

    const quote = tag[index];
    let value = '';
    if (quote === '"' || quote === "'") {
      index += 1;
      const valueStart = index;
      const valueEnd = tag.indexOf(quote, valueStart);
      if (valueEnd < 0) {
        return undefined;
      }
      value = tag.slice(valueStart, valueEnd);
      index = valueEnd + 1;
    } else {
      const valueStart = index;
      while (
        index < tag.length &&
        tag.charCodeAt(index) > 32 &&
        tag[index] !== '>'
      ) {
        index += 1;
      }
      value = tag.slice(valueStart, index);
    }

    if (name === targetName) {
      return value;
    }
  }

  return undefined;
}

function readMetaContent(html: string, property: string) {
  const lowerHtml = html.toLowerCase();
  const targetProperty = property.toLowerCase();
  let index = 0;

  while (index >= 0) {
    const metaStart = lowerHtml.indexOf('<meta', index);
    if (metaStart < 0) {
      return undefined;
    }

    const metaEnd = html.indexOf('>', metaStart);
    if (metaEnd < 0) {
      return undefined;
    }

    const tag = html.slice(metaStart, metaEnd + 1);
    const tagProperty =
      readAttribute(tag, 'property') ?? readAttribute(tag, 'name');

    if (tagProperty?.toLowerCase() === targetProperty) {
      return readAttribute(tag, 'content');
    }

    index = metaEnd + 1;
  }

  return undefined;
}

function stripTags(html: string) {
  let text = '';
  let insideTag = false;

  for (const char of html) {
    if (char === '<') {
      insideTag = true;
      text += ' ';
      continue;
    }

    if (char === '>') {
      insideTag = false;
      text += ' ';
      continue;
    }

    if (!insideTag) {
      text += char;
    }
  }

  return text;
}

function extractTitle(html: string) {
  const ogTitle = readMetaContent(html, 'og:title');
  if (ogTitle) {
    return normalizeWhitespace(ogTitle);
  }

  const lowerHtml = html.toLowerCase();
  const titleStart = lowerHtml.indexOf('<title');
  if (titleStart < 0) {
    return undefined;
  }

  const openEnd = html.indexOf('>', titleStart);
  const closeStart = lowerHtml.indexOf('</title>', openEnd + 1);
  if (openEnd < 0 || closeStart < 0) {
    return undefined;
  }

  return normalizeWhitespace(html.slice(openEnd + 1, closeStart));
}

function extractDescription(html: string) {
  const description = readMetaContent(html, 'og:description');
  return description ? normalizeWhitespace(description) : undefined;
}

function toIsoDate(year: string, month: string, day: string) {
  const normalizedYear =
    year.length === 2 ? `20${year}` : year.padStart(4, '0');
  return `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function cleanLocationCandidate(value: string) {
  let candidate = normalizeWhitespace(value).replace(/[,.]$/, '');
  const nextLabelIndex = candidate.search(
    /\s(?:공연기간|기간|일시|날짜|공연장|장소|위치|행사장)(?:\s|[:：]|$)/,
  );

  if (nextLabelIndex > 0) {
    candidate = candidate.slice(0, nextLabelIndex);
  }

  return candidate
    .replace(/^(?:티켓링크|ticketlink|네이버 예약|MY플레이스 홈|MY플레이스)\s*/i, '')
    .replace(/^[0-9.\-\s년월일~]+/, '')
    .replace(/^(?:공연장|장소|위치|행사장)\s*/, '')
    .trim();
}

function isUsefulLocationCandidate(value: string) {
  return Boolean(value) && !/고객\s*센터|고객센터|MY플레이스/i.test(value);
}

function extractDateCandidates(text: string) {
  const candidates: string[] = [];
  const patterns = [
    /([12][0-9][0-9][0-9])[-./년][ ]*([0-9]{1,2})[-./월][ ]*([0-9]{1,2})[ ]*일?/g,
    /([0-9]{2})[.]([0-9]{1,2})[.]([0-9]{1,2})/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      candidates.push(toIsoDate(match[1], match[2], match[3]));
    }
  }

  return unique(candidates).slice(0, 5);
}

function extractLocationCandidates(text: string) {
  const candidates: string[] = [];
  const patterns = [
    /(?:장소|위치|공연장|행사장)\s*[:：]\s*([^\n\r<|/]{2,60})/g,
    /([가-힣A-Za-z0-9\s]+(?:DOME|돔|홀|센터|광장|카페|팝업|스퀘어|아레나|스타디움))/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      candidates.push(cleanLocationCandidate(match[1]));
    }
  }

  return unique(candidates.filter(isUsefulLocationCandidate)).slice(0, 5);
}

function extractStructuredLocationCandidates(html: string) {
  const candidates: string[] = [];
  const lowerHtml = html.toLowerCase();
  let index = 0;

  while (index >= 0) {
    const spanStart = lowerHtml.indexOf('<span', index);
    if (spanStart < 0) {
      break;
    }

    const openEnd = html.indexOf('>', spanStart);
    if (openEnd < 0) {
      break;
    }

    const tag = html.slice(spanStart, openEnd + 1);
    const className = readAttribute(tag, 'class');
    const hasPlaceClass = normalizeWhitespace(className ?? '')
      .split(' ')
      .includes('place');

    const closeStart = lowerHtml.indexOf('</span>', openEnd + 1);
    if (closeStart < 0) {
      break;
    }

    if (hasPlaceClass) {
      const plainPlace = normalizeWhitespace(
        stripTags(html.slice(openEnd + 1, closeStart)),
      );
      candidates.push(plainPlace);
    }

    index = closeStart + '</span>'.length;
  }

  return unique(candidates.filter(Boolean)).slice(0, 5);
}

export function parseEventUrlPreviewHtml(
  url: string,
  html: string,
): EventUrlPreview {
  const plainText = normalizeWhitespace(stripTags(html));
  const title = extractTitle(html);
  const description = extractDescription(html);
  const dateCandidates = extractDateCandidates(`${title ?? ''} ${plainText}`);
  const locationCandidates = unique([
    ...extractStructuredLocationCandidates(html),
    ...extractLocationCandidates(
      `${title ?? ''} ${description ?? ''} ${plainText}`,
    ),
  ]).slice(0, 5);

  return {
    url,
    title,
    description,
    dateCandidates,
    locationCandidates,
    confidence: title && dateCandidates.length > 0 ? 'medium' : 'low',
  };
}
