/// <reference types="cypress" />

// Seed value and place cursor at end of first line. Cursor inside list content is
// required for `getState` to identify the list token type — at column 0 the token
// is empty and the toggle falls into the wrong branch.
const seed = (text) =>
    cy.window().then((win) => {
        win.easyMDE.value(text);
        const firstLine = text.split('\n')[0];
        win.easyMDE.codemirror.setCursor({ line: 0, ch: firstLine.length });
    });

const selectAll = () =>
    cy.window().then((win) => win.easyMDE.codemirror.execCommand('selectAll'));

const expectValue = (expected) =>
    cy.window().should((win) => {
        expect(win.easyMDE.value()).to.eq(expected);
    });

describe('List toggle (default unordered bullet *)', () => {
    beforeEach(() => {
        cy.visit(__dirname + '/index.html');
    });

    describe('single line', () => {
        it('plain line + unordered → "* foo"', () => {
            seed('foo');
            cy.get('button.unordered-list').click();
            expectValue('* foo');
        });

        it('plain line + ordered → "1. foo"', () => {
            seed('foo');
            cy.get('button.ordered-list').click();
            expectValue('1. foo');
        });

        it('"* foo" + unordered toggles off → "foo"', () => {
            seed('* foo');
            cy.get('button.unordered-list').click();
            expectValue('foo');
        });

        it('"1. foo" + ordered toggles off → "foo"', () => {
            seed('1. foo');
            cy.get('button.ordered-list').click();
            expectValue('foo');
        });

        it('"1. foo" + unordered → "* foo"', () => {
            seed('1. foo');
            cy.get('button.unordered-list').click();
            expectValue('* foo');
        });

        it('"* foo" + ordered → "1. foo"', () => {
            seed('* foo');
            cy.get('button.ordered-list').click();
            expectValue('1. foo');
        });

        // Bold + ordered list — exercises the path where `getState` returns multiple
        // keys (bold + ordered-list). Cursor placed inside the bold content so both
        // are detected.
        it('"1. **foo**" + unordered → "* **foo**" (bold + ordered)', () => {
            cy.window().then((win) => {
                win.easyMDE.value('1. **foo**');
                win.easyMDE.codemirror.setCursor({ line: 0, ch: 6 });
            });
            cy.get('button.unordered-list').click();
            expectValue('* **foo**');
        });

        // Master quirk: indent is NOT preserved — "* " is prepended in front, leaving
        // the original whitespace after the marker. Locked in as-is.
        it('indented plain line + unordered → "*     foo" (indent moves after marker)', () => {
            seed('    foo');
            cy.get('button.unordered-list').click();
            expectValue('*     foo');
        });
    });

    describe('multi-line (3 lines, select all)', () => {
        it('plain → unordered prefixes each line', () => {
            seed('a\nb\nc');
            selectAll();
            cy.get('button.unordered-list').click();
            expectValue('* a\n* b\n* c');
        });

        it('plain → ordered numbers each line', () => {
            seed('a\nb\nc');
            selectAll();
            cy.get('button.ordered-list').click();
            expectValue('1. a\n2. b\n3. c');
        });

        it('ordered → unordered swaps markers', () => {
            seed('1. a\n2. b\n3. c');
            selectAll();
            cy.get('button.unordered-list').click();
            expectValue('* a\n* b\n* c');
        });

        it('unordered → ordered renumbers', () => {
            seed('* a\n* b\n* c');
            selectAll();
            cy.get('button.ordered-list').click();
            expectValue('1. a\n2. b\n3. c');
        });
    });
});

describe('Check-list toggle', () => {
    beforeEach(() => {
        cy.visit(__dirname + '/index.html');
    });

    describe('single line', () => {
        it('plain line + check-list → "- [ ] foo"', () => {
            seed('foo');
            cy.get('button.check-list').click();
            expectValue('- [ ] foo');
        });

        it('"- [ ] foo" + check-list toggles off → "foo"', () => {
            seed('- [ ] foo');
            cy.get('button.check-list').click();
            expectValue('foo');
        });

        it('"- [x] foo" + check-list toggles off → "foo" (checked variant)', () => {
            seed('- [x] foo');
            cy.get('button.check-list').click();
            expectValue('foo');
        });

        it('"- [X] foo" + check-list toggles off → "foo" (uppercase X variant)', () => {
            seed('- [X] foo');
            cy.get('button.check-list').click();
            expectValue('foo');
        });

        it('"* foo" + check-list → "- [ ] foo"', () => {
            seed('* foo');
            cy.get('button.check-list').click();
            expectValue('- [ ] foo');
        });

        it('"1. foo" + check-list → "- [ ] foo"', () => {
            seed('1. foo');
            cy.get('button.check-list').click();
            expectValue('- [ ] foo');
        });

        it('"- [ ] foo" + unordered → "* foo"', () => {
            seed('- [ ] foo');
            cy.get('button.unordered-list').click();
            expectValue('* foo');
        });

        it('"- [ ] foo" + ordered → "1. foo"', () => {
            seed('- [ ] foo');
            cy.get('button.ordered-list').click();
            expectValue('1. foo');
        });
    });

    describe('multi-line (3 lines, select all)', () => {
        it('plain → check-list prefixes each line', () => {
            seed('a\nb\nc');
            selectAll();
            cy.get('button.check-list').click();
            expectValue('- [ ] a\n- [ ] b\n- [ ] c');
        });

        it('unordered → check-list swaps markers', () => {
            seed('* a\n* b\n* c');
            selectAll();
            cy.get('button.check-list').click();
            expectValue('- [ ] a\n- [ ] b\n- [ ] c');
        });

        it('ordered → check-list swaps markers', () => {
            seed('1. a\n2. b\n3. c');
            selectAll();
            cy.get('button.check-list').click();
            expectValue('- [ ] a\n- [ ] b\n- [ ] c');
        });

        it('check-list → unordered swaps markers', () => {
            seed('- [ ] a\n- [ ] b\n- [ ] c');
            selectAll();
            cy.get('button.unordered-list').click();
            expectValue('* a\n* b\n* c');
        });
    });
});

describe('List toggle (configured unorderedListStyle: "-")', () => {
    beforeEach(() => {
        cy.visit(__dirname + '/index-dash.html');
    });

    it('plain line + unordered uses configured "-" bullet', () => {
        seed('foo');
        cy.get('button.unordered-list').click();
        expectValue('- foo');
    });
});
