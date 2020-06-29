import { createRadixNode, setRadixNodeKey, sortRadixNodeChildren } from '../../src/radix/node';

describe('RadixNode', () => {
  /**
   * set key
   */
  describe('setRadixNodeKey', () => {
    test('accepts change when assigned', () => {
      const node = createRadixNode('abc');
      expect(node.key).toEqual('abc');

      setRadixNodeKey(node, 'xyz');
      expect(node.key).toEqual('xyz');
    });

    test('modifies kind when assigned', () => {
      const node = createRadixNode('abc');
      expect(node.kind).toEqual(0);

      setRadixNodeKey(node, ':files');
      expect(node.kind).toEqual(1);
    });
  });

  /**
   * Payload
   */
  describe('#payload', () => {
    test('accepts any payload values', () => {
      const node = createRadixNode('abc', 'payload');
      expect(node.payload).toBeTruthy();
      expect(node.payload).toEqual('payload');
    });

    test('makes optional to provide a payload', () => {
      const node = createRadixNode('abc');
      expect(node.payload).toBeFalsy();
    });
  });

  /**
   * priority
   */
  describe('#priority', () => {
    test('calculates it based on key length', () => {
      const node = createRadixNode('abc');
      expect(node.priority).toEqual(3);
    });

    test('calculates key length until named parameter is encountered.', () => {
      const node = createRadixNode('/path/:file');
      expect(node.priority).toEqual(6);
    });

    test('calculates key length until glob parameter is encountered.', () => {
      const node = createRadixNode('/path/*file');
      expect(node.priority).toEqual(6);
    });

    test('changes when key changes', () => {
      const node = createRadixNode('a');
      expect(node.priority).toEqual(1);

      setRadixNodeKey(node, 'bc');
      expect(node.priority).toEqual(2);

      setRadixNodeKey(node, '/de/:fg');
      expect(node.priority).toEqual(4);
    });
  });

  /**
   * sort
   */
  describe('sortRadixNodeChildren', () => {
    test('orders children nodes by priority', () => {
      const root = createRadixNode('/');
      const nodes = [
        createRadixNode('a'),
        createRadixNode('bc'),
        createRadixNode('def'),
      ];

      root.children.push(...nodes);
      sortRadixNodeChildren(root);

      expect(root.children[0]).toEqual(nodes[2]);
      expect(root.children[1]).toEqual(nodes[1]);
      expect(root.children[2]).toEqual(nodes[0]);
    });
  });
});
