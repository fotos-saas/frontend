import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TextUtilsService } from './text-utils.service';

describe('TextUtilsService', () => {
  let service: TextUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================================================
  // stripHtmlTags
  // ==========================================================================
  describe('stripHtmlTags', () => {
    it('eltávolítja az összes HTML taget', () => {
      expect(service.stripHtmlTags('<p>Hello <strong>világ</strong></p>')).toBe('Hello világ');
    });

    it('eltávolítja a beágyazott tageket is', () => {
      expect(service.stripHtmlTags('<div><ul><li>Elem</li></ul></div>')).toBe('Elem');
    });

    it('üres stringet ad üres inputra', () => {
      expect(service.stripHtmlTags('')).toBe('');
    });

    it('üres stringet ad null-szerű inputra', () => {
      expect(service.stripHtmlTags(null as unknown as string)).toBe('');
      expect(service.stripHtmlTags(undefined as unknown as string)).toBe('');
    });

    it('eltávolítja a script tageket is (XSS védelem)', () => {
      const result = service.stripHtmlTags('<script>alert("xss")</script>Szöveg');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('megtartja a sima szöveget változtatás nélkül', () => {
      expect(service.stripHtmlTags('Egyszerű szöveg')).toBe('Egyszerű szöveg');
    });
  });

  // ==========================================================================
  // decodeHtmlEntities
  // ==========================================================================
  describe('decodeHtmlEntities', () => {
    it('dekódolja az &amp; entitást', () => {
      expect(service.decodeHtmlEntities('A &amp; B')).toBe('A & B');
    });

    it('dekódolja az &lt; és &gt; entitásokat', () => {
      expect(service.decodeHtmlEntities('&lt;div&gt;')).toBe('<div>');
    });

    it('dekódolja a &nbsp; entitást', () => {
      expect(service.decodeHtmlEntities('Hello&nbsp;World')).toBe('Hello\u00A0World');
    });

    it('dekódolja a numerikus entitásokat', () => {
      expect(service.decodeHtmlEntities('&#169;')).toBe('\u00A9'); // copyright
    });

    it('üres stringet ad üres inputra', () => {
      expect(service.decodeHtmlEntities('')).toBe('');
    });

    it('üres stringet ad null-szerű inputra', () => {
      expect(service.decodeHtmlEntities(null as unknown as string)).toBe('');
      expect(service.decodeHtmlEntities(undefined as unknown as string)).toBe('');
    });

    it('nem módosítja a normál szöveget', () => {
      expect(service.decodeHtmlEntities('Teszt szöveg')).toBe('Teszt szöveg');
    });
  });

  // ==========================================================================
  // normalizeWhitespace
  // ==========================================================================
  describe('normalizeWhitespace', () => {
    it('non-breaking space-t normál szóközre cseréli', () => {
      expect(service.normalizeWhitespace('Hello\u00A0World')).toBe('Hello World');
    });

    it('több egymást követő szóközt egyre redukálja', () => {
      expect(service.normalizeWhitespace('Hello    World')).toBe('Hello World');
    });

    it('trim-eli a szöveget', () => {
      expect(service.normalizeWhitespace('  Hello  ')).toBe('Hello');
    });

    it('tab és newline karaktereket is kezeli', () => {
      expect(service.normalizeWhitespace('Hello\t\nWorld')).toBe('Hello World');
    });

    it('üres stringet ad üres inputra', () => {
      expect(service.normalizeWhitespace('')).toBe('');
    });

    it('üres stringet ad null-szerű inputra', () => {
      expect(service.normalizeWhitespace(null as unknown as string)).toBe('');
      expect(service.normalizeWhitespace(undefined as unknown as string)).toBe('');
    });
  });

  // ==========================================================================
  // truncate
  // ==========================================================================
  describe('truncate', () => {
    it('nem csonkolja a rövid szöveget', () => {
      expect(service.truncate('Rövid szöveg', 100)).toBe('Rövid szöveg');
    });

    it('csonkolja a hosszú szöveget és ... suffixet ad', () => {
      const long = 'A'.repeat(200);
      const result = service.truncate(long, 50);
      expect(result.length).toBe(50);
      expect(result).toMatch(/\.\.\.$/);
    });

    it('figyelembe veszi a suffix hosszát', () => {
      const text = 'A'.repeat(20);
      const result = service.truncate(text, 10, '...');
      // maxLength=10, suffix='...' (3 karakter) → 7 karakter + '...' = 10
      expect(result.length).toBe(10);
      expect(result).toBe('A'.repeat(7) + '...');
    });

    it('egyéni suffixet használ', () => {
      const text = 'A'.repeat(20);
      const result = service.truncate(text, 10, ' [...]');
      expect(result).toMatch(/\[\.\.\.\]$/);
    });

    it('default maxLength 150', () => {
      const text = 'A'.repeat(200);
      const result = service.truncate(text);
      expect(result.length).toBe(150);
    });

    it('trim-eli a szöveget feldolgozás előtt', () => {
      expect(service.truncate('  Hello  ', 100)).toBe('Hello');
    });

    it('üres stringet ad üres inputra', () => {
      expect(service.truncate('')).toBe('');
    });

    it('üres stringet ad null-szerű inputra', () => {
      expect(service.truncate(null as unknown as string)).toBe('');
      expect(service.truncate(undefined as unknown as string)).toBe('');
    });

    it('pontosan maxLength hosszúságú szöveget nem csonkolja', () => {
      const text = 'A'.repeat(10);
      expect(service.truncate(text, 10)).toBe(text);
    });
  });

  // ==========================================================================
  // htmlToPlainPreview
  // ==========================================================================
  describe('htmlToPlainPreview', () => {
    it('HTML-t plain text előnézetté konvertálja', () => {
      const html = '<p>Hello <strong>világ</strong>!</p>';
      const result = service.htmlToPlainPreview(html, 100);
      expect(result).toBe('Hello világ!');
    });

    it('csonkolja a hosszú eredményt', () => {
      const html = '<p>' + 'A'.repeat(200) + '</p>';
      const result = service.htmlToPlainPreview(html, 50);
      expect(result.length).toBe(50);
      expect(result).toMatch(/\.\.\.$/);
    });

    it('normalizálja a whitespace-eket', () => {
      const html = '<p>Hello</p><p>World</p>';
      const result = service.htmlToPlainPreview(html, 100);
      // A tagek eltávolítása után a whitespace normalizálódik
      expect(result).not.toMatch(/\s{2,}/);
    });

    it('üres stringet ad üres inputra', () => {
      expect(service.htmlToPlainPreview('')).toBe('');
    });

    it('üres stringet ad null-szerű inputra', () => {
      expect(service.htmlToPlainPreview(null as unknown as string)).toBe('');
      expect(service.htmlToPlainPreview(undefined as unknown as string)).toBe('');
    });

    it('default maxLength 150', () => {
      const html = '<p>' + 'A'.repeat(200) + '</p>';
      const result = service.htmlToPlainPreview(html);
      expect(result.length).toBe(150);
    });
  });

  // ==========================================================================
  // getFirstWords
  // ==========================================================================
  describe('getFirstWords', () => {
    it('az első N szót adja vissza', () => {
      const text = 'egy kettő három négy öt hat';
      expect(service.getFirstWords(text, 3)).toBe('egy kettő három...');
    });

    it('nem csonkolja ha a szavak száma kisebb mint a limit', () => {
      const text = 'egy kettő három';
      expect(service.getFirstWords(text, 10)).toBe('egy kettő három');
    });

    it('default 20 szó', () => {
      const words = Array.from({ length: 25 }, (_, i) => `szó${i}`).join(' ');
      const result = service.getFirstWords(words);
      const resultWords = result.replace('...', '').trim().split(/\s+/);
      expect(resultWords.length).toBe(20);
    });

    it('...-t fűz hozzá ha csonkol', () => {
      const text = 'egy kettő három négy öt';
      expect(service.getFirstWords(text, 2)).toBe('egy kettő...');
    });

    it('üres stringet ad üres inputra', () => {
      expect(service.getFirstWords('')).toBe('');
    });

    it('üres stringet ad null-szerű inputra', () => {
      expect(service.getFirstWords(null as unknown as string)).toBe('');
      expect(service.getFirstWords(undefined as unknown as string)).toBe('');
    });

    it('trim-eli az inputot', () => {
      const text = '  egy kettő három  ';
      expect(service.getFirstWords(text, 2)).toBe('egy kettő...');
    });
  });

  // ==========================================================================
  // isEmpty
  // ==========================================================================
  describe('isEmpty', () => {
    it('true-t ad üres stringre', () => {
      expect(service.isEmpty('')).toBe(true);
    });

    it('true-t ad whitespace-only stringre', () => {
      expect(service.isEmpty('   ')).toBe(true);
      expect(service.isEmpty('\t\n')).toBe(true);
    });

    it('true-t ad null/undefined-re', () => {
      expect(service.isEmpty(null)).toBe(true);
      expect(service.isEmpty(undefined)).toBe(true);
    });

    it('false-t ad nem üres stringre', () => {
      expect(service.isEmpty('Hello')).toBe(false);
      expect(service.isEmpty('  Hello  ')).toBe(false);
      expect(service.isEmpty('0')).toBe(false);
    });
  });

  // ==========================================================================
  // getPlainTextLength
  // ==========================================================================
  describe('getPlainTextLength', () => {
    it('HTML nélküli szöveg hosszát adja', () => {
      expect(service.getPlainTextLength('<p>Hello</p>')).toBe(5);
    });

    it('whitespace normalizálás utáni hosszat adja', () => {
      const html = '<p>Hello   World</p>';
      expect(service.getPlainTextLength(html)).toBe(11); // "Hello World"
    });

    it('0-t ad üres inputra', () => {
      expect(service.getPlainTextLength('')).toBe(0);
    });

    it('0-t ad null-szerű inputra', () => {
      expect(service.getPlainTextLength(null as unknown as string)).toBe(0);
      expect(service.getPlainTextLength(undefined as unknown as string)).toBe(0);
    });

    it('csak a tényleges szöveget számolja', () => {
      const html = '<div><span>ABC</span><em>DEF</em></div>';
      expect(service.getPlainTextLength(html)).toBe(6); // "ABCDEF"
    });
  });
});
