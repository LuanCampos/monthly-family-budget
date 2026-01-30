import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (class name utility)', () => {
  describe('basic merging', () => {
    it('should merge multiple class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle single class name', () => {
      expect(cn('single-class')).toBe('single-class');
    });

    it('should handle empty call', () => {
      expect(cn()).toBe('');
    });
  });

  describe('conditional classes', () => {
    it('should include truthy conditional classes', () => {
      const isActive = true;
      const isPrimary = true;
      const result = cn('base', isActive && 'active', isPrimary && 'primary');
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).toContain('primary');
    });

    it('should exclude falsy conditional classes', () => {
      const isHidden = false;
      const isDisabled = null;
      const isError = undefined;
      const result = cn('base', isHidden && 'hidden', isDisabled && 'disabled', isError && 'error');
      expect(result).toBe('base');
      expect(result).not.toContain('hidden');
      expect(result).not.toContain('disabled');
      expect(result).not.toContain('error');
    });

    it('should handle mixed truthy and falsy conditions', () => {
      // Use variables to avoid no-constant-binary-expression lint error
      const showVisible = true;
      const showHidden = false;
      const positiveValue = 1;
      const zeroValue = 0;
      const emptyValue = '';
      
      const result = cn(
        'base',
        showVisible && 'visible',
        showHidden && 'hidden',
        positiveValue && 'positive',
        zeroValue && 'zero',
        emptyValue && 'empty'
      );
      expect(result).toContain('base');
      expect(result).toContain('visible');
      expect(result).toContain('positive');
      expect(result).not.toContain('hidden');
      expect(result).not.toContain('zero');
      expect(result).not.toContain('empty');
    });
  });

  describe('tailwind class conflict resolution', () => {
    it('should resolve conflicting color classes (keep last)', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should resolve conflicting background classes', () => {
      const result = cn('bg-gray-100', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('should resolve conflicting padding classes', () => {
      const result = cn('p-2', 'p-4');
      expect(result).toBe('p-4');
    });

    it('should resolve conflicting margin classes', () => {
      const result = cn('m-2', 'm-4');
      expect(result).toBe('m-4');
    });

    it('should resolve conflicting flex classes', () => {
      const result = cn('flex-row', 'flex-col');
      expect(result).toBe('flex-col');
    });

    it('should keep non-conflicting classes together', () => {
      const result = cn('p-4', 'm-2', 'text-lg', 'bg-blue-500');
      expect(result).toContain('p-4');
      expect(result).toContain('m-2');
      expect(result).toContain('text-lg');
      expect(result).toContain('bg-blue-500');
    });
  });

  describe('array and object support', () => {
    it('should handle array of classes', () => {
      const result = cn(['class1', 'class2', 'class3']);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle object with boolean values', () => {
      const result = cn({
        active: true,
        disabled: false,
        primary: true,
      });
      expect(result).toContain('active');
      expect(result).toContain('primary');
      expect(result).not.toContain('disabled');
    });

    it('should handle mixed arrays, objects, and strings', () => {
      const result = cn(
        'base',
        ['array-class'],
        { 'object-class': true, 'excluded': false }
      );
      expect(result).toContain('base');
      expect(result).toContain('array-class');
      expect(result).toContain('object-class');
      expect(result).not.toContain('excluded');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined and null gracefully', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('should handle empty strings', () => {
      const result = cn('base', '', 'end');
      expect(result).toBe('base end');
    });

    it('should handle whitespace-only strings', () => {
      const result = cn('base', '   ', 'end');
      // Should trim or ignore whitespace-only strings
      expect(result).not.toContain('   ');
    });
  });

  describe('real-world usage patterns', () => {
    it('should handle component variant pattern', () => {
      type VariantType = 'primary' | 'secondary';
      type SizeType = 'sm' | 'lg';
      
      const variant: VariantType = 'primary';
      const size: SizeType = 'lg';
      
      const result = cn(
        'btn',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === ('secondary' as VariantType) && 'bg-gray-500 text-black',
        size === ('sm' as SizeType) && 'text-sm px-2 py-1',
        size === 'lg' && 'text-lg px-4 py-2'
      );
      
      expect(result).toContain('btn');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-lg');
      expect(result).not.toContain('bg-gray-500');
      expect(result).not.toContain('text-sm');
    });

    it('should handle dialog styling pattern from copilot-instructions', () => {
      const result = cn(
        'bg-card border-border sm:max-w-md flex flex-col gap-0 p-0',
        'max-h-[90vh] overflow-hidden'
      );
      
      expect(result).toContain('bg-card');
      expect(result).toContain('border-border');
      expect(result).toContain('sm:max-w-md');
      expect(result).toContain('max-h-[90vh]');
    });

    it('should handle hover state overrides', () => {
      const result = cn(
        'text-muted-foreground',
        'hover:text-primary hover:bg-primary/10'
      );
      
      expect(result).toContain('text-muted-foreground');
      expect(result).toContain('hover:text-primary');
      expect(result).toContain('hover:bg-primary/10');
    });
  });
});
