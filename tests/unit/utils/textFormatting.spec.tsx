import { test, expect } from '@playwright/test';
import { renderTextWithHashtags } from '../../../src/utils/textFormatting';
import React from 'react';

test.describe('renderTextWithHashtags function', () => {
    test('returns null for empty string', () => {
        expect(renderTextWithHashtags('')).toBeNull();
    });

    test('returns null for undefined or null inputs', () => {
        expect(renderTextWithHashtags(undefined as unknown as string)).toBeNull();
        expect(renderTextWithHashtags(null as unknown as string)).toBeNull();
    });

    test('renders string without hashtags as a single item array', () => {
        const result = renderTextWithHashtags('Hello world');
        expect(result).toEqual(['Hello world']);
    });

    test('renders string with a single hashtag correctly', () => {
        const result = renderTextWithHashtags('Hello #world');
        expect(result).toHaveLength(3);
        expect(result?.[0]).toBe('Hello ');

        const hashtagSpan = result?.[1] as React.ReactElement<{children: string, className: string}>;
        expect(hashtagSpan.type).toBe('span');
        expect(hashtagSpan.props.children).toBe('#world');
        expect(hashtagSpan.props.className).toContain('font-mono');

        expect(result?.[2]).toBe('');
    });

    test('renders string with multiple hashtags', () => {
        const result = renderTextWithHashtags('#hello beautiful #world');
        expect(result).toHaveLength(5);
        expect(result?.[0]).toBe('');

        const hashtag1 = result?.[1] as React.ReactElement<{children: string, className: string}>;
        expect(hashtag1.props.children).toBe('#hello');

        expect(result?.[2]).toBe(' beautiful ');

        const hashtag2 = result?.[3] as React.ReactElement<{children: string, className: string}>;
        expect(hashtag2.props.children).toBe('#world');

        expect(result?.[4]).toBe('');
    });

    test('handles special characters in hashtags', () => {
        const result = renderTextWithHashtags('Me encanta #España and #café');
        expect(result).toHaveLength(5);
        expect((result?.[1] as React.ReactElement<{children: string, className: string}>).props.children).toBe('#España');
        expect((result?.[3] as React.ReactElement<{children: string, className: string}>).props.children).toBe('#café');
    });

    test('ignores isolated # symbols', () => {
        const result = renderTextWithHashtags('Number # 1');
        expect(result).toEqual(['Number # 1']);
    });
});
