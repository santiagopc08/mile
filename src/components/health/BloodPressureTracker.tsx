'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/context/ProfileContext';
import { BloodPressureForm } from './blood-pressure/BloodPressureForm';
import { BloodPressureStats } from './blood-pressure/BloodPressureStats';
import { BloodPressureChart } from './blood-pressure/BloodPressureChart';
import { BloodPressureHistory } from './blood-pressure/BloodPressureHistory';
import type { BloodPressureEntry } from './blood-pressure/types';

export const BloodPressureTracker = () => {
    const { profile } = useProfile();
    const [selectedAuthor, setSelectedAuthor] = useState<'ella' | 'el'>(profile === 'ella' ? 'ella' : 'el');

    useEffect(() => {
        if (profile) setSelectedAuthor(profile === 'ella' ? 'ella' : 'el');
    }, [profile]);

    const [entries, setEntries] = useState<BloodPressureEntry[]>([]);

    const fetchEntries = useCallback(async () => {
        if (!profile) return;

        const { data, error } = await supabase
            .from('blood_pressure')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blood pressure entries:', error);
            return;
        }
        if (data) setEntries(data);
    }, [profile]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    return (
        <div className="space-y-5 font-mono">
            <BloodPressureForm
                selectedAuthor={selectedAuthor}
                setSelectedAuthor={setSelectedAuthor}
                entries={entries}
                onEntryAdded={fetchEntries}
            />
            <BloodPressureStats entries={entries} />
            <BloodPressureChart entries={entries} />
            <BloodPressureHistory entries={entries} />
        </div>
    );
};
