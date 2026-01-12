// 자동거래 연속 실행 스케줄러
// 실행이 끝나면 5분 대기 후 다음 실행 시작
import 'dotenv/config'
import { executeTrade } from './executor'

// 대기 시간 설정 (분 단위) - 기본값 5분
const WAIT_MINUTES = parseInt(process.env.WAIT_MINUTES || '5', 10)
const WAIT_MS = WAIT_MINUTES * 60 * 1000

// 거래 실행 중 플래그 (중복 실행 방지)
let isRunning = false
let shouldStop = false

// 대기 시간을 읽기 쉬운 형식으로 변환
function formatWaitTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}분 ${seconds}초`
}

// 거래 실행 함수 (에러 처리 포함)
async function runTradeWithErrorHandling(): Promise<void> {
  if (isRunning) {
    console.log('이전 거래 실행이 아직 진행 중입니다. 건너뜁니다.')
    return
  }

  if (shouldStop) {
    console.log('스케줄러가 중지되었습니다.')
    return
  }

  isRunning = true
  const startTime = new Date()

  try {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`자동거래 실행 시작 (${startTime.toLocaleString('ko-KR')})`)
    console.log(`${'='.repeat(60)}\n`)

    await executeTrade()

    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000
    console.log(`\n거래 실행 완료 (소요 시간: ${duration.toFixed(2)}초)`)
  } catch (error) {
    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000
    console.error(`\n거래 실행 중 오류 발생 (소요 시간: ${duration.toFixed(2)}초):`, error)

    // 에러가 발생해도 다음 실행은 계속 진행
  } finally {
    isRunning = false
  }
}

// 연속 실행 루프
async function continuousTradeLoop(): Promise<void> {
  while (!shouldStop) {
    // 거래 실행
    await runTradeWithErrorHandling()

    if (shouldStop) {
      break
    }

    // 다음 실행까지 대기
    const nextRunTime = new Date(Date.now() + WAIT_MS)

    console.log(`\n다음 실행까지 대기: ${formatWaitTime(WAIT_MS)}`)
    console.log(`다음 실행 예정 시간: ${nextRunTime.toLocaleString('ko-KR')}`)
    console.log(`${'='.repeat(60)}\n`)

    // 대기 (중간에 중지 신호가 오면 빠져나감)
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (shouldStop) {
          clearInterval(interval)
          resolve()
        }
      }, 1000)

      setTimeout(() => {
        clearInterval(interval)
        resolve()
      }, WAIT_MS)
    })
  }
}

// 스케줄러 시작 함수
export function startScheduler(): void {
  console.log('\n자동거래 연속 실행 스케줄러 시작')
  console.log(`대기 시간: ${WAIT_MINUTES}분`)
  console.log(`대기 시간 변경: 환경변수 WAIT_MINUTES 설정`)
  console.log(`중지: Ctrl+C\n`)

  // 연속 실행 시작
  continuousTradeLoop().catch((error) => {
    console.error('스케줄러 오류:', error)
    process.exit(1)
  })
}

// 직접 실행 시
if (require.main === module) {
  startScheduler()

  // 프로세스 종료 시그널 처리
  process.on('SIGINT', () => {
    console.log('\n\n자동거래 스케줄러 종료 중...')
    shouldStop = true

    // 실행 중이면 완료될 때까지 대기
    if (isRunning) {
      console.log('현재 실행 중인 거래가 완료될 때까지 대기합니다...')
      const checkInterval = setInterval(() => {
        if (!isRunning) {
          clearInterval(checkInterval)
          console.log('종료 완료')
          process.exit(0)
        }
      }, 1000)
    } else {
      console.log('종료 완료')
      process.exit(0)
    }
  })

  process.on('SIGTERM', () => {
    console.log('\n\n자동거래 스케줄러 종료 중...')
    shouldStop = true

    if (isRunning) {
      console.log('현재 실행 중인 거래가 완료될 때까지 대기합니다...')
      const checkInterval = setInterval(() => {
        if (!isRunning) {
          clearInterval(checkInterval)
          console.log('종료 완료')
          process.exit(0)
        }
      }, 1000)
    } else {
      console.log('종료 완료')
      process.exit(0)
    }
  })
}
