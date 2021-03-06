var assert = require('assert');
var e = require('../index');
var Context = require('../lib/context');

describe('CSS Expression', function() {
	it('simple math', function() {
		assert.equal(e('1+2'), 3);
		assert.equal(e('1 + 2'), 3);
		assert.equal(e('1 - 2'), -1);
		assert.equal(e('100 + 12'), 112);
		assert.equal(e('1 + 2 * 3'), 7);
		assert.equal(e('(1 + 2) * 3'), 9);
		assert.equal(e('((1 + 2) * 3) / 9'), 1);
		assert.equal(e('-3 + 2'), -1);
		assert.equal(e('6 / -2'), -3);

		assert.equal(e('1'), 1);
		assert.equal(e('1 + 2 * 4'), 9);
		assert.equal(e('1em'), '1em');
		assert.equal(e('1em + 2'), '3em');
		assert.equal(e('1em + 2px'), '3em');
		assert.equal(e('100% / 4'), '25%');
	});

	it('comparison operators', function() {
		assert.equal(e('1 < 2'), true);
		assert.equal(e('1 > 2'), false);
		assert.equal(e('1 = 1'), true);
		assert.equal(e('2 + 2 = 2 * 2'), true);
		assert.equal(e('2 + 2 <= 2 * 2'), true);
		assert.equal(e('2 + 2 =< 2 * 2'), true); // LESS
		assert.equal(e('2 + 2 >= 2 * 2'), true);
		assert.equal(e('2 + 3 = 2 * 2'), false);
		assert.equal(e('2 + 3 != 2 * 2'), true);
	});

	it('colors', function() {
		assert.equal(e('#fc0'), '#ffcc00');
		assert.equal(e('#111 + #222'), '#333333');
		assert.equal(e('#111 > #222'), false);
		assert.equal(e('#111 + 2'), '#131313');
		assert.equal(e('#111 + 22'), '#272727');

		assert.equal(e('#555 + 2'), '#575757');
		assert.equal(e('#fff + 2'), '#ffffff');
		assert.equal(e('#111 + #222'), '#333333');
		assert.equal(e('3 * #111'), '#333333');
	});

	it('variables', function() {
		var ctx = new Context({
			'@a': 2, '@b': 4,
			'$a': 2, '$b': 4,
			'@c': '@a + @b',
			'@border-color': '#111',
			'a': 1
		});

		assert.equal(e('@a + @b', ctx), 6);
		assert.equal(e('@c * 2', ctx), 12);
		assert.equal(e('1 + @a * @b', ctx), 9);
		assert.equal(e('1 + $a * $b', ctx), 9);
		assert.equal(e('3 + @border-color', ctx), '#141414');
		assert.equal(e('a >= 0', ctx), true);
		
		assert.equal(e('@a + @d', ctx), '2@d'); // unknown variable
	});

	it('functions', function() {
		var ctx = new Context({
			'@a': 2, '@b': 4,
			'foo': function(num) {
				return num.value * 3;
			}
		});

		assert.equal(e('4 + foo(5)', ctx), '19');
		assert.equal(e('4 + foo(5, 6)', ctx), '19');

		// for unknown function should return 
		// function expression with resolved arguments
		assert.equal(e('bar(@a, @b)', ctx), 'bar(2, 4)');
		assert.equal(e('bar(@a, @b, foo(5))', ctx), 'bar(2, 4, 15)');
		assert.equal(e('foo', ctx), 'foo');

		assert.equal(e('url("a.png")'), 'url("a.png")');
		assert.equal(e('url("a.png", 3px, 0)'), 'url("a.png", 3px, 0)');
	});

	it('implicit color/variable conversion', function() {
		// There's `red()` function as well as `red` keyword as color.
		// Expression resolver should properly detect both cases
		var ctx = new Context();
		assert.equal(e('red', ctx), 'red');

		// in case of keywords, algebra behaviour is undefined
		assert.equal(e('red + blue', ctx), 'redblue');
		assert.equal(e('red + 3', ctx), 'red3');

		assert.equal(e('red(#fc0)', ctx), '255');
		assert.equal(e('red(#fc0) + green(#fc0)', ctx), '459');
	});

	it('stringify unknown functions', function() {
		var ctx = new Context();
		assert.equal(e('foo()', ctx), 'foo()');
		assert.equal(e('foo(1 + 2)', ctx), 'foo(3)');
	});

	it('expressions with comma', function() {
		assert.equal(e('1, 2'), '1, 2');
		assert.equal(e('1 + 2, 4'), '3, 4');
		assert.equal(e('2, 3 * 4'), '2, 12');
	});

	it('unit equality', function() {
		assert.equal(e('1 = 1'), true);
		assert.equal(e('1 = 2'), false);
		assert.equal(e('1px = 1%'), false);
		assert.equal(e('1px = 1'), true);
	});

	it('string equality', function() {
		assert.equal(e('"a" = "a"'), true);
		assert.equal(e('"a" = \'a\''), true);
	});
});