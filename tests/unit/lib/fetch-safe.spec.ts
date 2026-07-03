import { test, expect } from '@playwright/test';
import { isLocalOrPrivateIP } from '../../../src/lib/fetch-safe';

test.describe('isLocalOrPrivateIP', () => {
    test('identifies IPv4 loopback addresses', () => {
        expect(isLocalOrPrivateIP('127.0.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('127.1.2.3')).toBe(true);
    });

    test('identifies IPv4 private class A addresses', () => {
        expect(isLocalOrPrivateIP('10.0.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('10.255.255.255')).toBe(true);
    });

    test('identifies IPv4 private class B addresses', () => {
        expect(isLocalOrPrivateIP('172.16.0.0')).toBe(true);
        expect(isLocalOrPrivateIP('172.20.1.1')).toBe(true);
        expect(isLocalOrPrivateIP('172.31.255.255')).toBe(true);
        // Not class B private
        expect(isLocalOrPrivateIP('172.15.255.255')).toBe(false);
        expect(isLocalOrPrivateIP('172.32.0.0')).toBe(false);
    });

    test('identifies IPv4 private class C addresses', () => {
        expect(isLocalOrPrivateIP('192.168.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('192.168.255.255')).toBe(true);
        // Not class C private
        expect(isLocalOrPrivateIP('192.169.0.1')).toBe(false);
    });

    test('identifies IPv4 link-local addresses', () => {
        expect(isLocalOrPrivateIP('169.254.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('169.254.255.255')).toBe(true);
        // Not link-local
        expect(isLocalOrPrivateIP('169.253.0.1')).toBe(false);
    });

    test('identifies IPv4 current network and broadcast', () => {
        expect(isLocalOrPrivateIP('0.0.0.0')).toBe(true);
        expect(isLocalOrPrivateIP('255.255.255.255')).toBe(true);
    });

    test('identifies public IPv4 addresses', () => {
        expect(isLocalOrPrivateIP('8.8.8.8')).toBe(false);
        expect(isLocalOrPrivateIP('1.1.1.1')).toBe(false);
        expect(isLocalOrPrivateIP('104.21.55.10')).toBe(false);
    });

    test('identifies IPv4-mapped IPv6 addresses correctly', () => {
        expect(isLocalOrPrivateIP('::ffff:127.0.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('::ffff:10.0.0.1')).toBe(true);
        expect(isLocalOrPrivateIP('::ffff:8.8.8.8')).toBe(false);
    });

    test('identifies IPv6 loopback and unspecified addresses', () => {
        expect(isLocalOrPrivateIP('::1')).toBe(true);
        expect(isLocalOrPrivateIP('::')).toBe(true);
    });

    test('identifies IPv6 unique local addresses', () => {
        expect(isLocalOrPrivateIP('fc00::1')).toBe(true);
        expect(isLocalOrPrivateIP('fd12:3456:789a:1::1')).toBe(true);
        expect(isLocalOrPrivateIP('FD00::')).toBe(true); // case-insensitive
    });

    test('identifies IPv6 link-local addresses', () => {
        expect(isLocalOrPrivateIP('fe80::1')).toBe(true);
        expect(isLocalOrPrivateIP('fe90::1')).toBe(true);
        expect(isLocalOrPrivateIP('fea0::1')).toBe(true);
        expect(isLocalOrPrivateIP('feb0::1')).toBe(true);
        expect(isLocalOrPrivateIP('FE80::1')).toBe(true); // case-insensitive
    });

    test('identifies public IPv6 addresses', () => {
        expect(isLocalOrPrivateIP('2001:4860:4860::8888')).toBe(false);
        expect(isLocalOrPrivateIP('2606:4700:4700::1111')).toBe(false);
    });
});
