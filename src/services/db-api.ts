// src/services/db-api.ts

import type { OpenBoardsResponseItem } from '../types/train-checker.js';

export interface DepartureRequest {
    stopPlaceOrStation: {
        evaNumbers: string[];
    };
    timeWindow: {
        timeStart: string;
    };
    maxViaStops: number;
    maxEntriesPerTransportType: number;
    languages: string[];
}

export async function fetchDepartures(params: DepartureRequest): Promise<OpenBoardsResponseItem[]> {
    const url = 'https://apis.deutschebahn.com/db-api-marketplace/apis/open-boards/v1/departures';
    const headers: Record<string, string> = {
        'DB-Api-Key': process.env.DB_API_KEY || '',
        'DB-Client-Id': process.env.DB_CLIENT_ID || '',
        'Content-Type': 'application/json',
    };

    const filteredHeaders = Object.fromEntries(
        Object.entries(headers).filter(([key, value]) => value !== undefined)
    );

    const body = JSON.stringify(params);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: filteredHeaders,
            body,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as OpenBoardsResponseItem[];
    } catch (error) {
        console.error('Error fetching departures:', error);
        throw error;
    }
}