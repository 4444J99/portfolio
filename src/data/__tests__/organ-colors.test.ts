import { describe, expect, it } from 'vitest';
import { getOrganColor, normalizeOrganKey, organColorMap, organColors } from '../organ-colors';

describe('organ-colors', () => {
	it('should normalize organ keys correctly', () => {
		expect(normalizeOrganKey('ORGAN I')).toBe('ORGAN-I');
		expect(normalizeOrganKey('ORGAN-II')).toBe('ORGAN-II');
		expect(normalizeOrganKey('Meta')).toBe('META-ORGANVM');
		expect(normalizeOrganKey('Something Else')).toBe('Something Else');
	});

	it('should get correct organ colors', () => {
		expect(getOrganColor('ORGAN I')).toBe(organColors['ORGAN-I']);
		expect(getOrganColor('ORGAN-II')).toBe(organColors['ORGAN-II']);
		expect(getOrganColor('Meta')).toBe(organColors['META-ORGANVM']);
	});

	it('should use fallback for unknown keys', () => {
		expect(getOrganColor('Unknown', '#123456')).toBe('#123456');
		expect(getOrganColor('Unknown')).toBe('#888'); // Default fallback
	});

	it('should have matching values in organColorMap', () => {
		expect(organColorMap['ORGAN I']).toBe(organColors['ORGAN-I']);
		expect(organColorMap['Meta']).toBe(organColors['META-ORGANVM']);
	});
});
