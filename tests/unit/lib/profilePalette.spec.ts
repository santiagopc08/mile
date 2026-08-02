import { test, expect } from '@playwright/test';
import { getProfilePalette, PROFILE_PALETTE, NEUTRAL_PALETTE, ProfilePalette } from '../../../src/lib/profilePalette';

test.describe('getProfilePalette', () => {
    test('should return el palette when profile is el', () => {
        expect(getProfilePalette('el')).toEqual(PROFILE_PALETTE['el']);
    });

    test('should return ella palette when profile is ella', () => {
        expect(getProfilePalette('ella')).toEqual(PROFILE_PALETTE['ella']);
    });

    test('should return default fallback (NEUTRAL_PALETTE) when profile is null', () => {
        expect(getProfilePalette(null)).toEqual(NEUTRAL_PALETTE);
    });

    test('should return default fallback (NEUTRAL_PALETTE) when profile is undefined', () => {
        expect(getProfilePalette(undefined)).toEqual(NEUTRAL_PALETTE);
    });

    test('should return custom fallback when profile is null and fallback is provided', () => {
        const customFallback = {} as ProfilePalette;
        expect(getProfilePalette(null, customFallback)).toBe(customFallback);
    });
});
