import { describe, it, expect } from 'vitest';
import { cn } from './common';

describe('common utilities', () => {
  describe('cn (classNames merge)', () => {
    it('should merge multiple class strings', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      );
      
      expect(result).toBe('base-class active');
    });

    it('should merge Tailwind classes correctly', () => {
      // tailwind-merge should handle conflicting utilities
      const result = cn('px-4', 'px-6');
      expect(result).toBe('px-6'); // Later class wins
    });

    it('should handle object syntax', () => {
      const result = cn({
        'base-class': true,
        'active-class': true,
        'disabled-class': false,
      });
      
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('disabled-class');
    });

    it('should handle array syntax', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toBe('class1 class2');
    });

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle empty strings', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle complex Tailwind merges', () => {
      // Test bg-* conflict resolution
      const result1 = cn('bg-red-500', 'bg-blue-500');
      expect(result1).toBe('bg-blue-500');
      
      // Test text-* conflict resolution
      const result2 = cn('text-sm', 'text-lg');
      expect(result2).toBe('text-lg');
      
      // Test p-* vs px-* (not conflicting)
      const result3 = cn('p-4', 'px-2');
      expect(result3).toBe('p-4 px-2');
    });

    it('should preserve non-conflicting Tailwind classes', () => {
      const result = cn(
        'bg-card',
        'border-border',
        'text-foreground',
        'p-4',
        'rounded-lg'
      );
      
      expect(result).toContain('bg-card');
      expect(result).toContain('border-border');
      expect(result).toContain('text-foreground');
      expect(result).toContain('p-4');
      expect(result).toContain('rounded-lg');
    });

    it('should handle complex component patterns', () => {
      // Common pattern in the codebase
      const variant = 'ghost';
      const size = 'icon';
      
      const result = cn(
        'h-9 w-9',
        variant === 'ghost' && 'text-muted-foreground hover:text-primary',
        size === 'icon' && 'rounded-full'
      );
      
      expect(result).toContain('h-9');
      expect(result).toContain('w-9');
      expect(result).toContain('text-muted-foreground');
      expect(result).toContain('hover:text-primary');
      expect(result).toContain('rounded-full');
    });

    it('should handle dialog content patterns', () => {
      const result = cn(
        'bg-card border-border sm:max-w-md',
        'flex flex-col gap-0 p-0',
        'max-h-[90vh] overflow-hidden'
      );
      
      expect(result).toContain('bg-card');
      expect(result).toContain('border-border');
      expect(result).toContain('sm:max-w-md');
      expect(result).toContain('flex');
      expect(result).toContain('flex-col');
      expect(result).toContain('max-h-[90vh]');
    });

    it('should handle hover state combinations', () => {
      const result = cn(
        'text-muted-foreground',
        'hover:text-destructive',
        'hover:bg-destructive/10'
      );
      
      expect(result).toContain('text-muted-foreground');
      expect(result).toContain('hover:text-destructive');
      expect(result).toContain('hover:bg-destructive/10');
    });

    it('should handle responsive classes', () => {
      const result = cn('w-full', 'sm:w-auto', 'md:w-1/2', 'lg:w-1/3');
      
      expect(result).toContain('w-full');
      expect(result).toContain('sm:w-auto');
      expect(result).toContain('md:w-1/2');
      expect(result).toContain('lg:w-1/3');
    });
  });
});
