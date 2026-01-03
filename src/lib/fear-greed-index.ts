import axios from 'axios';

export interface FearAndGreedIndex {
  value: string;
  valueClassification: string;
  timestamp: string;
  timeUntilUpdate?: string;
}

// 공포탐욕지수 조회 (alternative.me API)
export async function getFearAndGreedIndex(): Promise<FearAndGreedIndex> {
  const response = await axios.get('https://api.alternative.me/fng/');
  const data = response.data.data[0];

  return {
    value: data.value,
    valueClassification: data.value_classification,
    timestamp: data.timestamp,
    timeUntilUpdate: data.time_until_update,
  };
}

