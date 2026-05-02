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

        // Master quirk: the issue #92 strip leaves a leading space, then `_toggle`
        // re-prepends "* " producing a double space. Locked in verbatim — the PR
        // explicitly tries to fix this; the test will fail if/when it does, prompting
        // a deliberate decision rather than a silent change.
        it('"1. foo" + unordered → "*  foo" (issue #92 path, double space)', () => {
            seed('1. foo');
            cy.get('button.unordered-list').click();
            expectValue('*  foo');
        });

        it('"* foo" + ordered → "1. foo"', () => {
            seed('* foo');
            cy.get('button.ordered-list').click();
            expectValue('1. foo');
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

        // Master quirk: same double-space as the single-line #92 case, repeated per line.
        it('ordered → unordered swaps markers (double-space quirk per line)', () => {
            seed('1. a\n2. b\n3. c');
            selectAll();
            cy.get('button.unordered-list').click();
            expectValue('*  a\n*  b\n*  c');
        });

        it('unordered → ordered renumbers', () => {
            seed('* a\n* b\n* c');
            selectAll();
            cy.get('button.ordered-list').click();
            expectValue('1. a\n2. b\n3. c');
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
