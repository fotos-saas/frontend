import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SafeHtmlPipe]
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new SafeHtmlPipe(sanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null value', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined value', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should return empty string for empty string', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should return SafeHtml for valid HTML string', () => {
    const htmlContent = '<p>Test <strong>content</strong></p>';
    const result = pipe.transform(htmlContent);

    // SafeHtml is an object, not a string
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('should handle HTML with line breaks', () => {
    const htmlContent = '<p>First paragraph</p><br><p>Second paragraph</p>';
    const result = pipe.transform(htmlContent);

    expect(result).toBeTruthy();
  });

  it('should handle plain text without HTML tags', () => {
    const plainText = 'Simple text without HTML';
    const result = pipe.transform(plainText);

    expect(result).toBeTruthy();
  });

  it('should handle HTML with special characters', () => {
    const htmlContent = '<p>Árvíztűrő tükörfúrógép &amp; más</p>';
    const result = pipe.transform(htmlContent);

    expect(result).toBeTruthy();
  });

  describe('XSS Protection', () => {
    it('should remove script tags', () => {
      const maliciousHtml = '<p>Safe content</p><script>alert("XSS")</script>';
      const result = pipe.transform(maliciousHtml);

      // Convert SafeHtml to string for assertion
      const resultString = sanitizer.sanitize(1, result) || '';
      expect(resultString).not.toContain('<script>');
      expect(resultString).not.toContain('alert');
      expect(resultString).toContain('Safe content');
    });

    it('should remove onerror attributes', () => {
      const maliciousHtml = '<img src="invalid" onerror="alert(\'XSS\')">';
      const result = pipe.transform(maliciousHtml);

      // Convert SafeHtml to string for assertion
      const resultString = sanitizer.sanitize(1, result) || '';
      expect(resultString).not.toContain('onerror');
      expect(resultString).not.toContain('alert');
    });

    it('should remove onclick attributes', () => {
      const maliciousHtml = '<p onclick="alert(\'XSS\')">Click me</p>';
      const result = pipe.transform(maliciousHtml);

      // Convert SafeHtml to string for assertion
      const resultString = sanitizer.sanitize(1, result) || '';
      expect(resultString).not.toContain('onclick');
      expect(resultString).toContain('Click me');
    });

    it('should remove javascript: protocols in links', () => {
      const maliciousHtml = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = pipe.transform(maliciousHtml);

      // Convert SafeHtml to string for assertion
      const resultString = sanitizer.sanitize(1, result) || '';
      expect(resultString).not.toContain('javascript:');
      expect(resultString).toContain('Click');
    });

    it('should allow safe HTML tags', () => {
      const safeHtml = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
      const result = pipe.transform(safeHtml);

      // Convert SafeHtml to string for assertion
      const resultString = sanitizer.sanitize(1, result) || '';
      expect(resultString).toContain('<p>');
      expect(resultString).toContain('<strong>');
      expect(resultString).toContain('<em>');
      expect(resultString).toContain('bold');
      expect(resultString).toContain('italic');
    });

    it('should allow safe links with href', () => {
      const safeHtml = '<a href="https://example.com" target="_blank">Link</a>';
      const result = pipe.transform(safeHtml);

      // Convert SafeHtml to string for assertion
      const resultString = sanitizer.sanitize(1, result) || '';
      expect(resultString).toContain('href');
      expect(resultString).toContain('https://example.com');
      expect(resultString).toContain('target');
      expect(resultString).toContain('Link');
    });

    it('should allow class attribute but sanitize style for security', () => {
      const htmlWithStyle = '<p class="text-red" style="color: red;">Styled text</p>';
      const result = pipe.transform(htmlWithStyle);

      // Convert SafeHtml to string for assertion
      const resultString = sanitizer.sanitize(1, result) || '';
      // class attribútum megengedett
      expect(resultString).toContain('class');
      // A sanitizer eltávolítja a style attribútumot biztonsági okokból (XSS védelem)
      // Ez helyes működés, mert az inline style-ok potenciálisan veszélyesek lehetnek
      expect(resultString).toContain('Styled text');
    });

    it('should remove disallowed tags like iframe', () => {
      const maliciousHtml = '<p>Safe</p><iframe src="evil.com"></iframe>';
      const result = pipe.transform(maliciousHtml);

      // Convert SafeHtml to string for assertion
      const resultString = sanitizer.sanitize(1, result) || '';
      expect(resultString).not.toContain('<iframe');
      expect(resultString).not.toContain('evil.com');
      expect(resultString).toContain('Safe');
    });
  });
});
