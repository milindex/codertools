'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage, pluralize } from './_shared';

const EXAMPLE = `<div class="card" data-id="42">
  <!-- User card -->
  <h2 class="card__title" style="font-size: 18px; color: #2f81f7">
    Hello <strong>world</strong>
  </h2>
  <img src="/avatar.png" alt="Avatar" width="48" height="48">
  <label for="email">Email</label>
  <input id="email" type="email" disabled>
  <p>Use &amp; enjoy, <a href="https://example.com?a=1&amp;b=2">learn more</a>.</p>
</div>`;

const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
]);

const ATTRIBUTE_MAP: Record<string, string> = {
  'accept-charset': 'acceptCharset',
  accesskey: 'accessKey',
  allowfullscreen: 'allowFullScreen',
  autocapitalize: 'autoCapitalize',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  charset: 'charSet',
  class: 'className',
  colspan: 'colSpan',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  enctype: 'encType',
  for: 'htmlFor',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  frameborder: 'frameBorder',
  hreflang: 'hrefLang',
  'http-equiv': 'httpEquiv',
  inputmode: 'inputMode',
  itemid: 'itemID',
  itemprop: 'itemProp',
  itemref: 'itemRef',
  itemscope: 'itemScope',
  itemtype: 'itemType',
  maxlength: 'maxLength',
  minlength: 'minLength',
  novalidate: 'noValidate',
  playsinline: 'playsInline',
  readonly: 'readOnly',
  referrerpolicy: 'referrerPolicy',
  rowspan: 'rowSpan',
  spellcheck: 'spellCheck',
  srcdoc: 'srcDoc',
  srcset: 'srcSet',
  tabindex: 'tabIndex',
  usemap: 'useMap',
  'xlink:href': 'xlinkHref',
  'xml:lang': 'xmlLang',
  'xml:space': 'xmlSpace',
  'xmlns:xlink': 'xmlnsXlink',
  'alignment-baseline': 'alignmentBaseline',
  'baseline-shift': 'baselineShift',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'dominant-baseline': 'dominantBaseline',
  'enable-background': 'enableBackground',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'filter-units': 'filterUnits',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'image-rendering': 'imageRendering',
  'lighting-color': 'lightingColor',
  'marker-end': 'markerEnd',
  'marker-mid': 'markerMid',
  'marker-start': 'markerStart',
  'mask-type': 'maskType',
  'mask-units': 'maskUnits',
  'paint-order': 'paintOrder',
  'shape-rendering': 'shapeRendering',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'text-rendering': 'textRendering',
  'vector-effect': 'vectorEffect',
  viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio',
  gradientunits: 'gradientUnits',
  gradienttransform: 'gradientTransform',
  patternunits: 'patternUnits',
  patterncontentunits: 'patternContentUnits',
  patterntransform: 'patternTransform',
  clippathunits: 'clipPathUnits',
  markerwidth: 'markerWidth',
  markerheight: 'markerHeight',
  markerunits: 'markerUnits',
  refx: 'refX',
  refy: 'refY',
  spreadmethod: 'spreadMethod',
  stddeviation: 'stdDeviation',
  textlength: 'textLength',
  lengthadjust: 'lengthAdjust',
  attributename: 'attributeName',
  attributetype: 'attributeType',
  basefrequency: 'baseFrequency',
  baseprofile: 'baseProfile',
  calcmode: 'calcMode',
  keypoints: 'keyPoints',
  keysplines: 'keySplines',
  keytimes: 'keyTimes',
  numoctaves: 'numOctaves',
  repeatcount: 'repeatCount',
  repeatdur: 'repeatDur',
  requiredextensions: 'requiredExtensions',
  requiredfeatures: 'requiredFeatures',
  specularconstant: 'specularConstant',
  specularexponent: 'specularExponent',
  surfacescale: 'surfaceScale',
  systemlanguage: 'systemLanguage',
  targetx: 'targetX',
  targety: 'targetY',
  transformorigin: 'transformOrigin',
  viewtarget: 'viewTarget',
  zoomandpan: 'zoomAndPan',
};

const EVENT_ATTRIBUTE_MAP: Record<string, string> = {
  onblur: 'onBlur',
  onchange: 'onChange',
  onclick: 'onClick',
  oncontextmenu: 'onContextMenu',
  ondblclick: 'onDoubleClick',
  ondrag: 'onDrag',
  ondragend: 'onDragEnd',
  ondragenter: 'onDragEnter',
  ondragleave: 'onDragLeave',
  ondragover: 'onDragOver',
  ondragstart: 'onDragStart',
  ondrop: 'onDrop',
  onerror: 'onError',
  onfocus: 'onFocus',
  oninput: 'onInput',
  onkeydown: 'onKeyDown',
  onkeypress: 'onKeyPress',
  onkeyup: 'onKeyUp',
  onload: 'onLoad',
  onmousedown: 'onMouseDown',
  onmouseenter: 'onMouseEnter',
  onmouseleave: 'onMouseLeave',
  onmousemove: 'onMouseMove',
  onmouseout: 'onMouseOut',
  onmouseover: 'onMouseOver',
  onmouseup: 'onMouseUp',
  onpointercancel: 'onPointerCancel',
  onpointerdown: 'onPointerDown',
  onpointerenter: 'onPointerEnter',
  onpointerleave: 'onPointerLeave',
  onpointermove: 'onPointerMove',
  onpointerout: 'onPointerOut',
  onpointerover: 'onPointerOver',
  onpointerup: 'onPointerUp',
  onreset: 'onReset',
  onscroll: 'onScroll',
  onsubmit: 'onSubmit',
  ontouchcancel: 'onTouchCancel',
  ontouchend: 'onTouchEnd',
  ontouchmove: 'onTouchMove',
  ontouchstart: 'onTouchStart',
  onwheel: 'onWheel',
};

const escapeText = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');

const camelCaseProperty = (property: string) => {
  if (property.startsWith('--')) {
    return JSON.stringify(property);
  }

  if (property.startsWith('-ms-')) {
    return `ms${property
      .slice(4)
      .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`;
  }

  if (property.startsWith('-')) {
    return property
      .slice(1)
      .replace(/^([a-z])/, (_, letter: string) => letter.toUpperCase())
      .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  }

  return property.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  );
};

const splitDeclarations = (value: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quote) {
      current += character;
      if (character === '\\') {
        const next = value[index + 1];
        if (next) {
          current += next;
          index += 1;
        }
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (character === ';' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  parts.push(current);
  return parts;
};

const convertStyle = (value: string) => {
  const entries: string[] = [];

  for (const declaration of splitDeclarations(value)) {
    const trimmed = declaration.trim();
    if (!trimmed) {
      continue;
    }

    let depth = 0;
    let quote: string | null = null;
    let separator = -1;

    for (let index = 0; index < trimmed.length; index += 1) {
      const character = trimmed[index];
      if (quote) {
        if (character === '\\') {
          index += 1;
        } else if (character === quote) {
          quote = null;
        }
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }
      if (character === '(') {
        depth += 1;
      } else if (character === ')') {
        depth = Math.max(0, depth - 1);
      } else if (character === ':' && depth === 0) {
        separator = index;
        break;
      }
    }

    if (separator === -1) {
      continue;
    }

    const property = trimmed.slice(0, separator).trim();
    const propertyValue = trimmed.slice(separator + 1).trim();
    if (!property || !propertyValue) {
      continue;
    }

    entries.push(
      `${camelCaseProperty(property)}: ${JSON.stringify(propertyValue)}`
    );
  }

  return entries;
};

const convertAttributeValue = (value: string) => {
  if (/["{}\n\r\t]/.test(value)) {
    return `{${JSON.stringify(value)}}`;
  }
  return `"${value}"`;
};

const convertElement = (
  element: Element,
  depth: number,
  warnings: string[]
): string => {
  const indent = '  '.repeat(depth);
  const isSvg = element.namespaceURI === 'http://www.w3.org/2000/svg';
  const rawTag = isSvg ? element.tagName : element.tagName.toLowerCase();
  const tag = rawTag;
  const attributes: string[] = [];

  for (const attribute of Array.from(element.attributes)) {
    const originalName = attribute.name;
    const lowerName = originalName.toLowerCase();
    const value = attribute.value;

    let name = isSvg ? originalName : lowerName;
    name = ATTRIBUTE_MAP[lowerName] ?? ATTRIBUTE_MAP[name] ?? name;

    if (/^on/i.test(name)) {
      warnings.push(
        `Inline event handler "${originalName}" on <${tag}> was converted to a string attribute. React expects a function, so review it manually.`
      );
      const eventName =
        EVENT_ATTRIBUTE_MAP[lowerName] ??
        `on${lowerName
          .slice(2)
          .replace(/^([a-z])/, (_, letter: string) => letter.toUpperCase())}`;
      attributes.push(`${eventName}=${convertAttributeValue(value)}`);
      continue;
    }

    if (lowerName === 'style') {
      const entries = convertStyle(value);
      if (entries.length > 0) {
        attributes.push(`style={{ ${entries.join(', ')} }}`);
      }
      continue;
    }

    if (BOOLEAN_ATTRIBUTES.has(lowerName)) {
      if (
        value === '' ||
        value.toLowerCase() === lowerName ||
        value === 'true'
      ) {
        attributes.push(name);
        continue;
      }
    }

    attributes.push(`${name}=${convertAttributeValue(value)}`);
  }

  const attributeText = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';

  if (tag === 'script' || tag === 'style') {
    warnings.push(
      `<${tag}> content was wrapped in dangerouslySetInnerHTML. Review it before using the JSX in production.`
    );
    const content = element.textContent ?? '';
    const inner = `dangerouslySetInnerHTML={{ __html: ${JSON.stringify(
      content
    )} }}`;
    return `${indent}<${tag}${attributeText} ${inner} />`;
  }

  if (tag === 'template') {
    warnings.push(
      'A <template> element was converted, but its content is not rendered by React without additional handling.'
    );
  }

  const childNodes =
    tag === 'template' && element instanceof HTMLTemplateElement
      ? Array.from(element.content.childNodes)
      : Array.from(element.childNodes);

  const children: string[] = [];

  for (const child of childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.nodeValue ?? '';

      if (!text.trim()) {
        if (!text.includes('\n')) {
          children.push(`${indent}  {' '}`);
        }
        continue;
      }

      if (tag === 'pre' || tag === 'textarea') {
        children.push(`${indent}  {${JSON.stringify(text)}}`);
        continue;
      }

      const normalized = text.replace(/\s+/g, ' ');
      const leading = normalized.startsWith(' ');
      const trailing = normalized.endsWith(' ');
      const core = normalized.trim();
      const value = `${leading ? "{' '}" : ''}${escapeText(core)}${
        trailing ? "{' '}" : ''
      }`;
      children.push(`${indent}  ${value}`);
      continue;
    }

    if (child.nodeType === Node.COMMENT_NODE) {
      const comment = (child.nodeValue ?? '').trim().replace(/\*\//g, '*\\/');
      children.push(`${indent}  {/* ${comment} */}`);
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(convertElement(child as Element, depth + 1, warnings));
    }
  }

  if (children.length === 0) {
    return `${indent}<${tag}${attributeText} />`;
  }

  return `${indent}<${tag}${attributeText}>\n${children.join('\n')}\n${indent}</${tag}>`;
};

const convertHtml = (source: string) => {
  const warnings: string[] = [];
  const parser = new DOMParser();
  const document = parser.parseFromString(source, 'text/html');

  const hasDocumentTags = /<!doctype|<html[\s>]/i.test(source);
  if (hasDocumentTags) {
    warnings.push(
      'A full HTML document was detected. Only the body content was converted to JSX.'
    );
  }

  const bodyHasContent = Array.from(document.body.childNodes).some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim() !== '')
  );

  const rootNodes = bodyHasContent
    ? Array.from(document.body.childNodes)
    : Array.from(document.head.childNodes);

  const parts: string[] = [];

  for (const node of rootNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue ?? '';
      if (!text.trim()) {
        continue;
      }
      parts.push(escapeText(text.replace(/\s+/g, ' ').trim()));
      continue;
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      const comment = (node.nodeValue ?? '').trim().replace(/\*\//g, '*\\/');
      parts.push(`{/* ${comment} */}`);
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      parts.push(convertElement(node as Element, 0, warnings));
    }
  }

  if (parts.length === 0) {
    throw new Error('No convertible HTML elements were found.');
  }

  const jsx =
    parts.length === 1 ? (parts[0] ?? '') : `<>\n${parts.join('\n')}\n</>`;

  return { jsx, warnings };
};

export default function HtmlToJsxTool() {
  const [input, setInput] = useState(EXAMPLE);
  const [output, setOutput] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    if (!input.trim()) {
      setOutput('');
      setWarnings([]);
      setError('Paste some HTML to convert to JSX.');
      return;
    }

    try {
      const result = convertHtml(input);
      setOutput(result.jsx);
      setWarnings(result.warnings);
      setError(null);
    } catch (conversionError) {
      setOutput('');
      setWarnings([]);
      setError(errorMessage(conversionError));
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Converts HTML attributes, self-closing tags, comments, inline styles, and common SVG attributes to JSX syntax."
        title="HTML input"
      >
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          label="HTML markup"
        >
          <Textarea
            aria-label="HTML markup"
            className="min-h-[340px]"
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={convert} variant="primary">
            Convert to JSX
          </Button>
          <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setWarnings([]);
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        {error && (
          <Callout className="mt-3" variant="error">
            {error}
          </Callout>
        )}

        {warnings.length > 0 && (
          <Callout
            className="mt-3"
            title={`${pluralize(warnings.length, 'warning')}`}
            variant="warning"
          >
            <ul className="list-disc space-y-1 pl-4">
              {[...new Set(warnings)].map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Callout>
        )}
      </Panel>

      <ResultPanel
        emptyText="JSX will appear here."
        filename="component.jsx"
        label="JSX output"
        mime="text/javascript;charset=utf-8"
        value={output}
      />
    </ToolLayout>
  );
}
