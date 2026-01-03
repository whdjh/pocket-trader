'use client';

import { useFearGreed } from '@/lib/hooks/queries/useFearGreed';

const getClassificationColor = (classification: string) => {
  const lower = classification.toLowerCase();
  if (lower.includes('extreme greed')) return 'text-red-600 bg-red-50';
  if (lower.includes('greed')) return 'text-orange-600 bg-orange-50';
  if (lower.includes('neutral')) return 'text-yellow-600 bg-yellow-50';
  if (lower.includes('fear')) return 'text-blue-600 bg-blue-50';
  if (lower.includes('extreme fear')) return 'text-green-600 bg-green-50';
  return 'text-gray-600 bg-gray-50';
};

const getClassificationText = (classification: string) => {
  const lower = classification.toLowerCase();
  if (lower.includes('extreme greed')) return '극도의 탐욕';
  if (lower.includes('greed')) return '탐욕';
  if (lower.includes('neutral')) return '중립';
  if (lower.includes('fear')) return '공포';
  if (lower.includes('extreme fear')) return '극도의 공포';
  return classification;
};

const getInvestmentAdvice = (value: number, classification: string) => {
  const lower = classification.toLowerCase();
  if (lower.includes('extreme greed')) {
    return '투자 비권유'; // 과매수 상태
  }
  if (lower.includes('greed')) {
    return '투자 신중'; // 신중하게 접근
  }
  if (lower.includes('neutral')) {
    return '투자 가능'; // 적절한 시점
  }
  if (lower.includes('extreme fear')) {
    return '투자 강력 권유'; // 매우 저점, 매수 기회
  }
  if (lower.includes('fear')) {
    return '투자 권유'; // 저점 매수 기회
  }
  return '투자 검토 필요';
};

export function FearGreedIndex() {
  const { data, isLoading, error } = useFearGreed();

  if (isLoading) {
    return (
      <div className="px-3 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">
        탐욕지수 로딩 중...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-3 py-1.5 rounded-md bg-gray-100 text-sm text-gray-600">
        탐욕지수 불러오기 실패
      </div>
    );
  }

  return (
    <div className={`px-3 py-1.5 rounded-md text-sm font-medium ${getClassificationColor(data.classification)}`}>
      탐욕지수: <span className="font-bold">{data.value}</span> ({getClassificationText(data.classification)}, {getInvestmentAdvice(data.value, data.classification)})
    </div>
  );
}

