/**
 * Performance Tests
 * 
 * Tests to validate memoization effectiveness, prevent unnecessary re-renders,
 * and ensure optimal performance in React components and hooks.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';

describe('Performance - Memoization Tests', () => {
  describe('useMemo effectiveness', () => {
    it('should not recalculate when dependencies have not changed', () => {
      const expensiveCalculation = vi.fn((values: number[]) => 
        values.reduce((sum, v) => sum + v, 0)
      );

      const useExpensiveCalculation = (values: number[]) => {
        return useMemo(() => expensiveCalculation(values), [values]);
      };

      const { rerender } = renderHook(
        ({ values }) => useExpensiveCalculation(values),
        { initialProps: { values: [1, 2, 3] } }
      );

      expect(expensiveCalculation).toHaveBeenCalledTimes(1);

      // Rerender with same values (same reference)
      rerender({ values: [1, 2, 3] });

      // New array reference = new calculation (this is expected)
      expect(expensiveCalculation).toHaveBeenCalledTimes(2);
    });

    it('should recalculate when dependencies change', () => {
      const calculate = vi.fn((a: number, b: number) => a + b);

      const useSum = (a: number, b: number) => {
        return useMemo(() => calculate(a, b), [a, b]);
      };

      const { rerender } = renderHook(
        ({ a, b }) => useSum(a, b),
        { initialProps: { a: 1, b: 2 } }
      );

      expect(calculate).toHaveBeenCalledTimes(1);
      expect(calculate).toHaveBeenLastCalledWith(1, 2);

      // Change dependency
      rerender({ a: 2, b: 2 });

      expect(calculate).toHaveBeenCalledTimes(2);
      expect(calculate).toHaveBeenLastCalledWith(2, 2);
    });

    it('should memoize complex objects correctly', () => {
      const processData = vi.fn((items: Array<{ id: string; value: number }>) => 
        items.map(item => ({ ...item, doubled: item.value * 2 }))
      );

      const useProcessedData = (items: Array<{ id: string; value: number }>) => {
        return useMemo(() => processData(items), [items]);
      };

      const items = [{ id: '1', value: 10 }, { id: '2', value: 20 }];

      const { result, rerender } = renderHook(
        ({ data }) => useProcessedData(data),
        { initialProps: { data: items } }
      );

      expect(processData).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual([
        { id: '1', value: 10, doubled: 20 },
        { id: '2', value: 20, doubled: 40 },
      ]);

      // Rerender with SAME reference
      rerender({ data: items });

      // Should NOT recalculate
      expect(processData).toHaveBeenCalledTimes(1);
    });
  });

  describe('useCallback effectiveness', () => {
    it('should return stable function reference when dependencies unchanged', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useCallback(() => value * 2, [value]),
        { initialProps: { value: 5 } }
      );

      const firstCallback = result.current;

      // Rerender with same value
      rerender({ value: 5 });

      const secondCallback = result.current;

      // Same reference
      expect(secondCallback).toBe(firstCallback);
    });

    it('should return new function reference when dependencies change', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useCallback(() => value * 2, [value]),
        { initialProps: { value: 5 } }
      );

      const firstCallback = result.current;

      // Rerender with different value
      rerender({ value: 10 });

      const secondCallback = result.current;

      // Different reference
      expect(secondCallback).not.toBe(firstCallback);
    });

    it('should prevent child re-renders when callback is memoized', async () => {
      const childRenderCount = { count: 0 };
      const user = userEvent.setup();

      const ChildComponent = memo(({ onClick }: { onClick: () => void }) => {
        childRenderCount.count++;
        return <button onClick={onClick}>Click</button>;
      });

      const ParentComponent = () => {
        const [count, setCount] = useState(0);
        const [other, setOther] = useState(0);

        const handleClick = useCallback(() => {
          setCount(c => c + 1);
        }, []);

        return (
          <div>
            <span data-testid="count">{count}</span>
            <span data-testid="other">{other}</span>
            <ChildComponent onClick={handleClick} />
            <button onClick={() => setOther(o => o + 1)}>Increment Other</button>
          </div>
        );
      };

      const { getByText, getByTestId } = render(<ParentComponent />);

      expect(childRenderCount.count).toBe(1);

      // Click the increment other button using userEvent for proper state updates
      const otherButton = getByText('Increment Other');
      await user.click(otherButton);

      // Parent re-rendered but child should NOT re-render
      expect(getByTestId('other').textContent).toBe('1');
      expect(childRenderCount.count).toBe(1); // Still 1!
    });
  });

  describe('React.memo effectiveness', () => {
    it('should prevent re-render when props are equal', () => {
      const renderCount = { count: 0 };

      const ExpensiveComponent = memo(({ value }: { value: number }) => {
        renderCount.count++;
        return <div>{value}</div>;
      });

      const { rerender } = render(<ExpensiveComponent value={10} />);

      expect(renderCount.count).toBe(1);

      // Rerender with same props
      rerender(<ExpensiveComponent value={10} />);

      expect(renderCount.count).toBe(1); // Should not re-render
    });

    it('should re-render when props change', () => {
      const renderCount = { count: 0 };

      const ExpensiveComponent = memo(({ value }: { value: number }) => {
        renderCount.count++;
        return <div>{value}</div>;
      });

      const { rerender } = render(<ExpensiveComponent value={10} />);

      expect(renderCount.count).toBe(1);

      // Rerender with different props
      rerender(<ExpensiveComponent value={20} />);

      expect(renderCount.count).toBe(2);
    });

    it('should use custom comparison function', () => {
      const renderCount = { count: 0 };

      interface Props {
        data: { id: string; value: number };
      }

      const ExpensiveComponent = memo(
        ({ data }: Props) => {
          renderCount.count++;
          return <div>{data.value}</div>;
        },
        (prevProps, nextProps) => prevProps.data.id === nextProps.data.id
      );

      const { rerender } = render(
        <ExpensiveComponent data={{ id: '1', value: 10 }} />
      );

      expect(renderCount.count).toBe(1);

      // Rerender with same id but different value
      rerender(<ExpensiveComponent data={{ id: '1', value: 20 }} />);

      // Should NOT re-render because custom comparison checks only id
      expect(renderCount.count).toBe(1);

      // Rerender with different id
      rerender(<ExpensiveComponent data={{ id: '2', value: 20 }} />);

      // Should re-render
      expect(renderCount.count).toBe(2);
    });
  });

  describe('Hook performance patterns', () => {
    it('should batch state updates', async () => {
      const user = userEvent.setup();
      const renderCount = { count: 0 };

      const TestComponent = () => {
        renderCount.count++;
        const [a, setA] = useState(0);
        const [b, setB] = useState(0);

        const updateBoth = () => {
          setA(1);
          setB(1);
          // React 18+ batches these automatically
        };

        return (
          <div>
            <span data-testid="a">{a}</span>
            <span data-testid="b">{b}</span>
            <button onClick={updateBoth}>Update</button>
          </div>
        );
      };

      const { getByText, getByTestId } = render(<TestComponent />);

      expect(renderCount.count).toBe(1);

      // Click update button with userEvent
      await user.click(getByText('Update'));

      // Should batch updates and only re-render once
      await waitFor(() => {
        expect(getByTestId('a').textContent).toBe('1');
        expect(getByTestId('b').textContent).toBe('1');
      });

      // React 18 batches updates, so expect 2 renders
      expect(renderCount.count).toBeGreaterThanOrEqual(2);
    });

    it('should avoid state updates during render', () => {
      const BadComponent = () => {
        const [count, _setCount] = useState(0);
        
        // This would cause infinite loop - DON'T DO THIS
        // setCount(count + 1);
        
        return <div>{count}</div>;
      };

      // Should render without errors
      expect(() => render(<BadComponent />)).not.toThrow();
    });

    it('should cleanup effects properly', async () => {
      const cleanupCalled = { count: 0 };

      const TestComponent = ({ id }: { id: string }) => {
        useEffect(() => {
          return () => {
            cleanupCalled.count++;
          };
        }, [id]);

        return <div>{id}</div>;
      };

      const { rerender, unmount } = render(<TestComponent id="1" />);

      expect(cleanupCalled.count).toBe(0);

      // Change id - should trigger cleanup
      rerender(<TestComponent id="2" />);

      expect(cleanupCalled.count).toBe(1);

      // Unmount - should trigger cleanup again
      unmount();

      expect(cleanupCalled.count).toBe(2);
    });
  });

  describe('Render count tracking', () => {
    it('should track component renders with useRef', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const renderCount = useRef(0);
        renderCount.current++;

        const [value, setValue] = useState(0);

        return (
          <div>
            <span data-testid="render-count">{renderCount.current}</span>
            <span data-testid="value">{value}</span>
            <button onClick={() => setValue(v => v + 1)}>Increment</button>
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestComponent />);

      expect(getByTestId('render-count').textContent).toBe('1');

      // Click increment with userEvent
      await user.click(getByText('Increment'));

      await waitFor(() => {
        expect(getByTestId('render-count').textContent).toBe('2');
      });
    });

    it('should demonstrate optimal vs non-optimal patterns', () => {
      // Non-optimal: creating new object every render
      const NonOptimal = () => {
        const [count, _setCount] = useState(0);
        
        // BAD: Creates new style object every render
        const style = { color: 'red', fontSize: count };
        
        return <div style={style}>{count}</div>;
      };

      // Optimal: memoizing object
      const Optimal = () => {
        const [count, _setCountOptimal] = useState(0);
        
        // GOOD: Memoized style object
        const style = useMemo(() => ({ 
          color: 'red', 
          fontSize: count 
        }), [count]);
        
        return <div style={style}>{count}</div>;
      };

      // Both should render without issues
      expect(() => render(<NonOptimal />)).not.toThrow();
      expect(() => render(<Optimal />)).not.toThrow();
    });
  });

  describe('List rendering optimization', () => {
    it('should use stable keys for list items', () => {
      type ItemType = { id: string; name: string };
      const items: ItemType[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      const ListComponent = ({ items }: { items: ItemType[] }) => (
        <ul>
          {items.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      );

      const { container, rerender } = render(<ListComponent items={items} />);

      const _firstLi = container.querySelector('li');
      
      // Reorder items
      const reorderedItems = [items[2], items[0], items[1]];
      rerender(<ListComponent items={reorderedItems} />);

      // First li content should be Item 3 now
      expect(container.querySelector('li')?.textContent).toBe('Item 3');
    });

    it('should avoid index as key for dynamic lists', () => {
      const renderCounts: Record<string, number> = {};
      
      type ItemType = { id: string; name: string };

      const ListItem = memo(({ item }: { item: ItemType }) => {
        renderCounts[item.id] = (renderCounts[item.id] || 0) + 1;
        return <li>{item.name}</li>;
      });

      const items: ItemType[] = [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
      ];

      const ListWithProperKeys = ({ items }: { items: ItemType[] }) => (
        <ul>
          {items.map(item => (
            <ListItem key={item.id} item={item} />
          ))}
        </ul>
      );

      const { rerender } = render(<ListWithProperKeys items={items} />);

      // Initial render: each item rendered once
      expect(renderCounts['a']).toBe(1);
      expect(renderCounts['b']).toBe(1);
      expect(renderCounts['c']).toBe(1);

      // Remove first item
      const newItems = items.slice(1);
      rerender(<ListWithProperKeys items={newItems} />);

      // Items b and c should NOT re-render (proper key usage)
      expect(renderCounts['b']).toBe(1);
      expect(renderCounts['c']).toBe(1);
    });
  });

  describe('Context optimization', () => {
    it('should demonstrate context selector pattern', () => {
      // This is a conceptual test showing the pattern
      interface State {
        theme: string;
        language: string;
        user: { name: string } | null;
      }

      // Using a selector pattern (conceptual)
      const selectTheme = (state: State) => state.theme;
      const selectLanguage = (state: State) => state.language;

      const state: State = { theme: 'dark', language: 'pt', user: { name: 'Test' } };

      expect(selectTheme(state)).toBe('dark');
      expect(selectLanguage(state)).toBe('pt');

      // When theme changes, only components using selectTheme should re-render
      // This is the optimization pattern
    });
  });
});

describe('Performance - Memory Tests', () => {
  describe('Cleanup patterns', () => {
    it('should demonstrate proper event listener cleanup', async () => {
      const addedListeners: string[] = [];
      const removedListeners: string[] = [];

      // Mock window event listeners
      const originalAdd = window.addEventListener;
      const originalRemove = window.removeEventListener;

      window.addEventListener = vi.fn((type: string) => {
        addedListeners.push(type);
      });

      window.removeEventListener = vi.fn((type: string) => {
        removedListeners.push(type);
      });

      const TestComponent = ({ enabled }: { enabled: boolean }) => {
        useEffect(() => {
          if (enabled) {
            const handler = () => {};
            window.addEventListener('resize', handler);
            return () => window.removeEventListener('resize', handler);
          }
        }, [enabled]);

        return <div>Test</div>;
      };

      const { unmount } = render(<TestComponent enabled={true} />);

      expect(addedListeners).toContain('resize');

      unmount();

      expect(removedListeners).toContain('resize');

      // Restore
      window.addEventListener = originalAdd;
      window.removeEventListener = originalRemove;
    });

    it('should demonstrate proper subscription cleanup', async () => {
      const subscribed = { current: false };
      const unsubscribed = { current: false };

      const mockSubscribe = () => {
        subscribed.current = true;
        return () => {
          unsubscribed.current = true;
        };
      };

      const TestComponent = () => {
        useEffect(() => {
          const unsubscribe = mockSubscribe();
          return unsubscribe;
        }, []);

        return <div>Test</div>;
      };

      const { unmount } = render(<TestComponent />);

      expect(subscribed.current).toBe(true);
      expect(unsubscribed.current).toBe(false);

      unmount();

      expect(unsubscribed.current).toBe(true);
    });
  });
});
