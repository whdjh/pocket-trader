import bcrypt from 'bcrypt';

// 사용법: pnpm tsx scripts/hash-password.ts <비밀번호>
const password = process.argv[2];

if (!password) {
  console.error('사용법: pnpm tsx scripts/hash-password.ts <비밀번호>');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('해시된 비밀번호:', hash);
  process.exit(0);
}).catch((error) => {
  console.error('오류:', error);
  process.exit(1);
});

