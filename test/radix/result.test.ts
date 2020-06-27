import { createRadixNode } from '../../src/radix/node';
import { createRadixResult, useRadixResultNode } from '../../src/radix/result';

describe('RadixResult', () => {
  describe('#key', () => {
    test('a new instance returns an empty key', () => {
      expect(createRadixResult().key).toEqual('');
    });
    test('given a single node, returns the key of that node', () => {
      const node = createRadixNode('/', 'root');
      const result = createRadixResult()
      useRadixResultNode(result, node);

      expect(result.key).toEqual('/');
    });
    test('given a multiple nodes, returns the combined keys of the nodes', () => {
      const nodes = [
        createRadixNode('/', 'root'),
        createRadixNode('about', 'about'),
      ];

      const result = createRadixResult();
      useRadixResultNode(result, nodes[0]);
      useRadixResultNode(result, nodes[1]);

      expect(result.key).toEqual('/about');
    });
  });

  describe('useRadixResultNode', () => {
    test('uses the node payload', () => {
      const result = createRadixResult();
      const node = createRadixNode('/', 'root');

      expect(result.payload).toBeFalsy();

      useRadixResultNode(result, node);
      expect(result.payload).toBeTruthy();
      expect(result.payload).toEqual(node.payload);
    });

    test('allow not to assing payload', () => {
      const result = createRadixResult();
      const node = createRadixNode('/', 'root');

      expect(result.payload).toBeFalsy();

      useRadixResultNode(result, node, false);
      expect(result.payload).toBeFalsy();
    });
  });
});
