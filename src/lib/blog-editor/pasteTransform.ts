/**
 * Cleans pasted HTML from Word, Google Docs, and web pages while preserving
 * headings, lists, bold, italic, underline, and links.
 */
export function transformPastedBlogHtml(html: string): string {
  if (!html?.trim() || typeof window === "undefined") {
    return html;
  }

  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?o:p[^>]*>/gi, "")
    .replace(/<\/?w:[^>]*>/gi, "")
    .replace(/<\/?m:[^>]*>/gi, "")
    .replace(/<\/?v:[^>]*>/gi, "")
    .replace(/&nbsp;/gi, " ");

  const doc = new DOMParser().parseFromString(cleaned, "text/html");
  normalizePastedNode(doc.body);

  return doc.body.innerHTML.trim() || "<p></p>";
}

function normalizePastedNode(node: Node): void {
  let child = node.firstChild;

  while (child) {
    const next = child.nextSibling;

    if (child.nodeType === Node.TEXT_NODE) {
      child = next;
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.remove();
      child = next;
      continue;
    }

    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "div" && el.attributes.length === 0) {
      unwrapElement(el);
      child = node.firstChild;
      continue;
    }

    if (tag === "b") {
      replaceTag(el, "strong");
    } else if (tag === "i") {
      replaceTag(el, "em");
    } else if (tag === "span" || tag === "font") {
      const semantic = spanToSemanticElement(el);
      if (semantic) {
        el.replaceWith(semantic);
        normalizePastedNode(semantic);
        child = next;
        continue;
      }
      unwrapElement(el);
      child = node.firstChild;
      continue;
    } else if (tag === "a") {
      stripToHrefOnly(el);
      normalizePastedNode(el);
    } else if (isAllowedTag(tag)) {
      stripInlineStyles(el);
      normalizePastedNode(el);
    } else {
      unwrapElement(el);
      child = node.firstChild;
      continue;
    }

    child = next;
  }
}

function isAllowedTag(tag: string): boolean {
  return [
    "p",
    "br",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "u",
    "s",
    "a",
    "blockquote",
    "hr",
  ].includes(tag);
}

function unwrapElement(el: HTMLElement): void {
  const parent = el.parentNode;
  if (!parent) return;

  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

function replaceTag(el: HTMLElement, newTag: string): void {
  const replacement = document.createElement(newTag);
  while (el.firstChild) {
    replacement.appendChild(el.firstChild);
  }
  el.replaceWith(replacement);
}

function stripInlineStyles(el: HTMLElement): void {
  el.removeAttribute("style");
  el.removeAttribute("class");
  el.removeAttribute("id");
}

function stripToHrefOnly(el: HTMLElement): void {
  const href = el.getAttribute("href");
  Array.from(el.attributes).forEach((attr) => el.removeAttribute(attr.name));
  if (href) {
    el.setAttribute("href", href);
  }
}

function spanToSemanticElement(el: HTMLElement): HTMLElement | null {
  const style = (el.getAttribute("style") ?? "").toLowerCase();
  const weight = /font-weight:\s*(bold|[7-9]00)/.test(style);
  const italic = /font-style:\s*italic/.test(style);
  const underline =
    /text-decoration:\s*underline/.test(style) || el.querySelector("u") !== null;

  if (!weight && !italic && !underline) {
    return null;
  }

  const wrap = (tag: string, content: Node | DocumentFragment) => {
    const wrapper = document.createElement(tag);
    wrapper.appendChild(content);
    return wrapper;
  };

  let content: Node | DocumentFragment = document.createDocumentFragment();
  const innerNodes = Array.from(el.childNodes);

  if (innerNodes.length) {
    innerNodes.forEach((node) => content.appendChild(node.cloneNode(true)));
  } else {
    content = document.createTextNode(el.textContent ?? "");
  }

  if (weight) content = wrap("strong", content);
  if (italic) content = wrap("em", content);
  if (underline) content = wrap("u", content);

  return content as HTMLElement;
}
