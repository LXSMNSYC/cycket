import { createRadixTree, addRadixTreePath, findRadixTreeResult } from '../../src/radix/tree';

/**
 * Errors
 */
import DuplicateError from '../../src/radix/exceptions/duplicate-error';
import SharedKeyError from '../../src/radix/exceptions/shared-key-error';

describe('RadixTree', () => {
  describe('createRadixTree', () => {
    test('contains a RadixNode as a root placeholder', () => {
      const tree = createRadixTree();
      expect(tree.root.payload).toBeFalsy();
      expect(tree.root.placeholder).toEqual(true);
    });
  });

  describe('addRadixTreePath', () => {
    /**
     * New instance
     */
    test('on a new instance, replaces placeholder with a new node', () => {
      const tree = createRadixTree();
      addRadixTreePath(tree, '/abc', 'abc');

      expect(tree.root.placeholder).toEqual(false);
      expect(tree.root.payload).toBeTruthy();
      expect(tree.root.payload).toEqual('abc');
    });

    /**
     * Shared roots
     */
    describe('shared root', () => {
      test('inserts adjacent nodes properly', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/a', 'a');
        addRadixTreePath(tree, '/bc', 'bc');

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('bc');
        expect(tree.root.children[0].payload).toEqual('bc');
        expect(tree.root.children[1].key).toEqual('a');
        expect(tree.root.children[1].payload).toEqual('a');
      });

      test('inserts nodes with shared parent', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/abc', 'abc');
        addRadixTreePath(tree, '/adef', 'adef');

        expect(tree.root.children.length).toEqual(1);
        expect(tree.root.children[0].key).toEqual('a');
        expect(tree.root.children[0].children.length).toEqual(2);
        expect(tree.root.children[0].children[0].key).toEqual('def');
        expect(tree.root.children[0].children[1].key).toEqual('bc');
      });

      test('inserts multiple parent nodes', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/admin/1', 'admin/1');
        addRadixTreePath(tree, '/admin/2', 'admin/2');
        addRadixTreePath(tree, '/blog/1', 'blog/1');
        addRadixTreePath(tree, '/blog/2', 'blog/2');

        expect(tree.root.children.length).toEqual(2);

        expect(tree.root.children[0].key).toEqual('admin/');
        expect(tree.root.children[0].payload).toBeFalsy();
        expect(tree.root.children[0].children.length).toEqual(2);
        expect(tree.root.children[0].children[0].key).toEqual('1');
        expect(tree.root.children[0].children[1].key).toEqual('2');

        expect(tree.root.children[1].key).toEqual('blog/');
        expect(tree.root.children[1].payload).toBeFalsy();
        expect(tree.root.children[1].children.length).toEqual(2);
        expect(tree.root.children[1].children[0].key).toEqual('1');
        expect(tree.root.children[1].children[1].key).toEqual('2');
      });

      test('inserts multiple nodes with mixed parents', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/abc', 'abc');
        addRadixTreePath(tree, '/abc/:d', 'abc:d');
        addRadixTreePath(tree, '/ad', 'ad');
        addRadixTreePath(tree, '/cde', 'cde');

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[1].key).toEqual('a');
        expect(tree.root.children[1].children.length).toEqual(2);
        expect(tree.root.children[1].children[0].payload).toEqual('abc');
        expect(tree.root.children[1].children[1].payload).toEqual('ad');
      });

      test('supports insertion of mixed routes out of order', () => {
        const tree = createRadixTree();

        addRadixTreePath(tree, '/page/setting', 'page/setting');
        addRadixTreePath(tree, '/pages/:page/setting', 'pages/:page/setting');
        addRadixTreePath(tree, '/pages/:page', 'pages/:page');
        addRadixTreePath(tree, '/page', 'page');

        expect(tree.root.key).toEqual('/page');
        expect(tree.root.payload).toEqual('page');
        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('/setting');
        expect(tree.root.children[1].key).toEqual('s/:page');
        expect(tree.root.children[1].payload).toEqual('pages/:page');
        expect(tree.root.children[1].children[0].key).toEqual('/setting');
      });
    });

    describe('mixed payload', () => {
      test('allows node with different payloads', () => {
        const payloads = [
          'Hello',
          1234,
          'World',
        ];

        const tree = createRadixTree();
        addRadixTreePath(tree, '/', payloads[0]);
        addRadixTreePath(tree, '/ab', payloads[1]);
        addRadixTreePath(tree, '/cde', payloads[2]);

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('cde');
        expect(tree.root.children[0].payload).toEqual(payloads[2]);
        expect(tree.root.children[1].key).toEqual('ab');
        expect(tree.root.children[1].payload).toEqual(payloads[1]);
      });
    });

    describe('dealing with unicode', () => {
      test('inserts properly adjacent parent nodes', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/こんにちは', 'japanese_hello');
        addRadixTreePath(tree, '/你好', 'chinese_hello');

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('こんにちは');
        expect(tree.root.children[1].key).toEqual('你好');
      });

      test('inserts nodes with shared parent', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/おはようございます', 'good morning');
        addRadixTreePath(tree, '/おやすみなさい', 'good night');

        expect(tree.root.children.length).toEqual(1);
        expect(tree.root.children[0].key).toEqual('お');
        expect(tree.root.children[0].children.length).toEqual(2);
        expect(tree.root.children[0].children[0].key).toEqual('はようございます');
        expect(tree.root.children[0].children[1].key).toEqual('やすみなさい');
      });
    });

    test('does not allow defining the same path twice', () => {
      const tree = createRadixTree();
      addRadixTreePath(tree, '/', 'root');
      addRadixTreePath(tree, '/abc', 'abc');

      expect(() => {
        addRadixTreePath(tree, '/', 'root');
      }).toThrow(DuplicateError);

      expect(tree.root.children.length).toEqual(1);
    });

    describe('dealing with named and glob parameters', () => {
      test('prioritizes node correctly', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/*file', 'all');
        addRadixTreePath(tree, '/a', 'a');
        addRadixTreePath(tree, '/a/:b', 'a/:b');
        addRadixTreePath(tree, '/a/:b/c', 'a/:b/c');
        addRadixTreePath(tree, '/a/b', 'a/b');

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('a');
        expect(tree.root.children[1].key).toEqual('*file');

        const node = tree.root.children[0].children[0].children;
        expect(node.length).toEqual(2);
        expect(node[0].key).toEqual('b');
        expect(node[1].key).toEqual(':b');
        expect(node[1].children[0].key).toEqual('/c');
      });

      test('does not split named parameters across shared key', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/:tree', 'tree');
        addRadixTreePath(tree, '/:tree/:sub', 'subtree');

        expect(tree.root.children.length).toEqual(1);
        expect(tree.root.children[0].key).toEqual(':tree');

        expect(tree.root.children[0].children.length).toEqual(1);
        expect(tree.root.children[0].children[0].key).toEqual('/:sub');
      });

      test('does allow same named parameter in different order of insertion', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/a/:b/c', 'c');
        addRadixTreePath(tree, '/a/d', 'd');
        addRadixTreePath(tree, '/a/:b/e', 'e');

        expect(tree.root.key).toEqual('/a/');
        expect(tree.root.children.length).toEqual(2);

        expect(tree.root.children[0].key).toEqual('d');
        expect(tree.root.children[1].key).toEqual(':b/');

        expect(tree.root.children[1].children[0].key).toEqual('c');
        expect(tree.root.children[1].children[1].key).toEqual('e');
      });

      test('does not allow different named parameters at the same level.', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/:a', 'a');

        expect(() => {
          addRadixTreePath(tree, '/:b', 'b');
        }).toThrow(SharedKeyError);
      });
    });
  });

  describe('findRadixTreeResult', () => {
    describe('single node', () => {
      test('result.found should be false when using a different path', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/a', 'a');

        const result = findRadixTreeResult(tree, '/b');
        expect(result.payload).toBeFalsy();
      });

      test('finds when key and path matches', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/a', 'a');

        const result = findRadixTreeResult(tree, '/a');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a');
        expect(result.payload).toEqual('a');
      });

      test('matches when path has trailing slash', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/a', 'a');

        const result = findRadixTreeResult(tree, '/a/');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a');
        expect(result.payload).toEqual('a');
      });

      test('matches when key has trailing slash', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/a/', 'a');

        const result = findRadixTreeResult(tree, '/a');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a/');
        expect(result.payload).toEqual('a');
      });
    });

    describe('shared parent', () => {
      test('finds matching path', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/abc', 'bc');
        addRadixTreePath(tree, '/axyz', 'xyz');

        const result = findRadixTreeResult(tree, '/abc');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/abc');
        expect(result.payload).toEqual('bc');
      });
    });

    describe('unicode nodes with shared parent', () => {
      test('finds matching path', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/おはようございます', 'good morning');
        addRadixTreePath(tree, '/おやすみなさい', 'good night');

        const result = findRadixTreeResult(tree, '/おはようございます');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/おはようございます');
        expect(result.payload).toEqual('good morning');
      });
    });

    describe('dealing with glob', () => {
      test('matches path, with parameters', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/*all', 'all');
        addRadixTreePath(tree, '/about', 'about');

        const result = findRadixTreeResult(tree, '/a/bc');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/*all');
        expect(result.payload).toEqual('all');
        expect(result.params).toBeTruthy();
        expect(result.params.all).toEqual('a/bc');
      });

      test('returns optional catch all', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/a/*b', 'b');

        const result = findRadixTreeResult(tree, '/a');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a/*b');
        expect(result.params).toBeTruthy();
        expect(result.params.b).toBeFalsy();
      });

      test('returns optional catch all by globbing', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/a*b', 'a/b');

        const result = findRadixTreeResult(tree, '/a');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a*b');
        expect(result.params).toBeTruthy();
        expect(result.params.b).toBeFalsy();
      });

      test('fails to match catch call when not in full match', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/a/b/*c', 'a/b/*c');

        const result = findRadixTreeResult(tree, '/a');
        expect(result.payload).toBeFalsy();
      });

      test('prefers specific match over catch all', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/a', 'a');
        addRadixTreePath(tree, '/a*b', 'a*b');

        const result = findRadixTreeResult(tree, '/a');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a');
      });

      test('prefers catch all over specific key with partial shared key', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/a/*b', 'a/*b');
        addRadixTreePath(tree, '/a/c', 'a/c');

        const result = findRadixTreeResult(tree, '/a/d');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a/*b');
        expect(result.params).toBeTruthy();
        expect(result.params.b).toEqual('d');
      });
    });

    describe('dealing with named', () => {
      test('matches correct path', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/a', 'a');
        addRadixTreePath(tree, '/a/:b', 'a/:b');
        addRadixTreePath(tree, '/a/:b/c', 'a/:b/c');

        const result = findRadixTreeResult(tree, '/a/s');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a/:b');
        expect(result.payload).toEqual('a/:b');
      });

      test('match fails on partial path', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/a', 'a');
        addRadixTreePath(tree, '/a/:b/c', 'a/:b/c');

        const result = findRadixTreeResult(tree, '/a/s');
        expect(result.payload).toBeFalsy();
      });

      test('returns named parameters in result', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/a', 'a');
        addRadixTreePath(tree, '/a/:b', 'a/:b');
        addRadixTreePath(tree, '/a/:b/c', 'a/:b/c');

        const result = findRadixTreeResult(tree, '/a/s');
        expect(result.payload).toBeTruthy();
        expect(result.params).toBeTruthy();
        expect(result.params.b).toEqual('s');
      });

      test('returns unicode values', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/a/:b', 'a/:b');
        addRadixTreePath(tree, '/a/:b/c', 'a/:b/c');

        const result = findRadixTreeResult(tree, 'a/こんにちは');
        expect(result.payload).toBeTruthy();
        expect(result.params).toBeTruthy();
        expect(result.params.b).toEqual('こんにちは');
      });

      test('prefers named parameter over specific key with partially shared key', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/a/:b', 'a/:b');
        addRadixTreePath(tree, '/a/c', 'a/c');

        const result = findRadixTreeResult(tree, '/a/d');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/a/:b');
        expect(result.params).toBeTruthy();
        expect(result.params.b).toEqual('d');
      });
    });

    describe('dealing with multiple named', () => {
      test('finds matching path', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/:a/:b', ':a/:b');

        const result = findRadixTreeResult(tree, '/c/d');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/:a/:b');
        expect(result.payload).toEqual(':a/:b');
      });

      test('returns named parameters', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/:a/:b', ':a/:b');

        const result = findRadixTreeResult(tree, '/c/d');
        expect(result.payload).toBeTruthy();
        expect(result.params).toBeTruthy();
        expect(result.params.a).toEqual('c');
        expect(result.params.b).toEqual('d');
      });
    });

    describe('dealing with both glob and named parameters', () => {
      test('matches specific path over glob parameter of the same level', () => {
        const tree = createRadixTree();
        addRadixTreePath(tree, '/', 'root');
        addRadixTreePath(tree, '/*a', 'all');
        addRadixTreePath(tree, '/b/:c', '/b/:c');

        const result = findRadixTreeResult(tree, '/b/d');
        expect(result.payload).toBeTruthy();
        expect(result.key).toEqual('/b/:c');
        expect(result.payload).toEqual('/b/:c');
      });
    });
  });
});
