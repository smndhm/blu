/**
 * <ds-file-field>: a file field (`.ds-c-field`) that also takes a file dropped anywhere on it, and refuses one that its
 * input does not accept, the browser checking `accept` in its dialog only. Its label, input and message stay in the
 * page, in its slot: without JavaScript they are a file field, and the label, the form and `aria-describedby` work.
 *
 * The page listens to the input's `change`, which a refused file does not reach. Set `invalid-type-message` and
 * `too-many-message` in the page's language. The message is a status region, for screen readers to announce a refusal.
 */
import own from './file-field.css?inline';

const INVALID_TYPE_MESSAGE = 'This type of file is not accepted.';
const TOO_MANY_MESSAGE = 'Only one file is accepted.';

/** Whether `accept`, as the input has it, takes this file: an extension, a media type, or a family (`image/*`) */
function accepts(file: File, accept: string): boolean {
  const types = accept
    .split(',')
    .map(type => type.trim().toLowerCase())
    .filter(Boolean);
  if (types.length === 0) return true;
  return types.some(type => {
    if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type);
    if (type.endsWith('/*')) return file.type.toLowerCase().startsWith(type.slice(0, -1));
    return file.type.toLowerCase() === type;
  });
}

export class DsFileField extends HTMLElement {
  // The message's own text, such as the accepted formats, to show again after a refusal
  private hint: string | null = null;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<style></style><slot></slot>';
    shadow.querySelector('style')!.textContent = own;
    this.addEventListener('dragenter', this.onDragOver);
    this.addEventListener('dragover', this.onDragOver);
    this.addEventListener('dragleave', this.onDragLeave);
    this.addEventListener('drop', this.onDrop);
    // Before the input's own listeners: the page's never hear of a refused file
    this.addEventListener('change', this.onChange, true);
  }

  connectedCallback(): void {
    // A status region already there when its text changes: screen readers announce the change
    const { message } = this;
    if (message && !message.hasAttribute('role')) message.setAttribute('role', 'status');
  }

  private get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input[type="file"]');
  }

  private get message(): HTMLElement | null {
    return this.querySelector<HTMLElement>('.ds-c-field__message');
  }

  /** Why these files are refused, in the page's words, or null */
  private refusal(input: HTMLInputElement, files: File[]): string | null {
    if (files.length > 1 && !input.multiple) return this.getAttribute('too-many-message') ?? TOO_MANY_MESSAGE;
    if (!files.every(file => accepts(file, input.accept))) return this.getAttribute('invalid-type-message') ?? INVALID_TYPE_MESSAGE;
    return null;
  }

  private refuse(input: HTMLInputElement, text: string): void {
    input.setAttribute('aria-invalid', 'true');
    const { message } = this;
    if (!message) return;
    this.hint ??= message.textContent;
    message.classList.add('ds-c-field__message--danger');
    message.textContent = text;
  }

  private clearRefusal(input: HTMLInputElement): void {
    input.removeAttribute('aria-invalid');
    const { message } = this;
    if (!message || this.hint === null) return;
    message.classList.remove('ds-c-field__message--danger');
    message.textContent = this.hint;
    this.hint = null;
  }

  private onDragOver = (event: DragEvent): void => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    // Else the browser opens the file, leaving the page
    event.preventDefault();
    if (this.input?.disabled) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    this.toggleAttribute('dragging', true);
  };

  private onDragLeave = (event: DragEvent): void => {
    // Not when going from one of its children to another
    if (!this.contains(event.relatedTarget as Node | null)) this.removeAttribute('dragging');
  };

  private onDrop = (event: DragEvent): void => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    this.removeAttribute('dragging');
    const { input } = this;
    if (!input || input.disabled) return;
    const text = this.refusal(input, [...event.dataTransfer.files]);
    if (text !== null) {
      this.refuse(input, text);
      return;
    }
    input.files = event.dataTransfer.files;
    // The browser fires them for a file chosen in its dialog, not for one set here
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  private onChange = (event: Event): void => {
    const { input } = this;
    if (!input || event.target !== input) return;
    const text = this.refusal(input, [...(input.files ?? [])]);
    if (text === null) {
      this.clearRefusal(input);
      return;
    }
    event.stopPropagation();
    input.value = '';
    this.refuse(input, text);
  };
}

customElements.define('ds-file-field', DsFileField);
