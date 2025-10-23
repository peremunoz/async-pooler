# ⚙️ async-pooler

> 🧩 A lightweight, typed and extensible async task pool with concurrency, retry strategies, and progress tracking — written in TypeScript.

[![npm version](https://img.shields.io/npm/v/async-pooler.svg?color=blue)](https://www.npmjs.com/package/async-pooler)
[![bun compatible](https://img.shields.io/badge/runs%20with-bun-fd0.svg)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

---

### ✨ Features

- 🔁 Run async tasks concurrently with a configurable limit.
- 🧠 Customizable **retry strategies** (exponential backoff, fixed delay, etc).
- 🧩 Fully **typed API** with generics and class-based design.
- 📊 Optional **progress tracking callbacks**.
- 🚀 Zero dependencies, small footprint, fast execution.

---

## 📦 Installation

```bash
# With Bun
bun add async-pooler

# Or npm / pnpm / yarn
npm install async-pooler
```

## 🚀 Quick Start

```ts
import { AsyncPool, Task, ExponentialBackoffStrategy } from 'async-pooler'

// Create a pool with max 3 concurrent tasks
const pool = new AsyncPool(3, {
  retryStrategy: new ExponentialBackoffStrategy(3, 100),
  onProgress: (done, total) => console.log(`Progress: ${done}/${total}`),
})

// Add some async tasks
for (let i = 0; i < 10; i++) {
  pool.add(
    new Task(`job-${i}`, async () => {
      if (Math.random() < 0.2) throw new Error('Random fail')
      await new Promise((r) => setTimeout(r, 100))
      return `Task ${i} done`
    })
  )
}

// Run all tasks
const results = await pool.runAll()
console.log(results)
```

### 🧩 Output example:

```
Progress: 1/10
Progress: 2/10
...
[ 'Task 0 done', 'Task 1 done', ... ]
```

## 🔁 Retrying Tasks with RetryableTask
When you need individual tasks that automatically retry upon failure,
use the RetryableTask class — it encapsulates its own retry logic.

```ts
import {
  AsyncPool,
  RetryableTask,
  ExponentialBackoffStrategy
} from 'async-pooler'

// Create a pool (global retry strategy optional)
const pool = new AsyncPool(2, {
  onProgress: (done, total) => console.log(`Progress: ${done}/${total}`),
})

// Add retryable tasks
for (let i = 0; i < 5; i++) {
  pool.add(
    new RetryableTask(
      `retry-${i}`,
      async () => {
        if (Math.random() < 0.7) throw new Error('Flaky task')
        return `✅ Task ${i} succeeded`
      },
      // Custom retry strategy (3 retries, exponential backoff starting at 50ms)
      new ExponentialBackoffStrategy(3, 50)
    )
  )
}

const results = await pool.runAll()
console.log(results)

```
🧠 In this example:

- Each RetryableTask retries independently, using its own strategy.

- The AsyncPool doesn’t interfere — it simply runs the tasks concurrently.

### Example output:

```
Progress: 1/5
Progress: 2/5
...
[ '✅ Task 0 succeeded', '✅ Task 1 succeeded', ... ]
```

## ⏱️ Using Timeouts with `TimedTask`
Sometimes tasks might hang — use TimedTask to automatically fail after a delay.

```ts
import { AsyncPool, TimedTask } from 'async-pooler'

const pool = new AsyncPool(2)

pool.add(
  new TimedTask(
    'fast',
    async () => {
      await new Promise((r) => setTimeout(r, 100))
      return '⚡ Fast done'
    },
    1000 // timeout in ms
  )
)

pool.add(
  new TimedTask(
    'slow',
    async () => {
      await new Promise((r) => setTimeout(r, 2000))
      return '🐢 Slow done'
    },
    1000
  )
)

const results = await pool.runAll()
console.log(results)
```
### Example output:

```
[ '⚡ Fast done', Error: Task "slow" timed out after 1000ms ]
```

### 🔁 + ⏱️ Combining Retry and Timeout
You can also combine both behaviors with RetryableTimedTask:

```ts
import {
  AsyncPool,
  RetryableTimedTask,
  ExponentialBackoffStrategy
} from 'async-pooler'

const pool = new AsyncPool(2)

pool.add(
  new RetryableTimedTask(
    'hybrid-task',
    async () => {
      if (Math.random() < 0.8) throw new Error('Still unstable')
      return '🎯 Success after retries'
    },
    1000, // timeout
    new ExponentialBackoffStrategy(4, 100) // retry config
  )
)

const results = await pool.runAll()
console.log(results)
```
### Example output:

```
[ '🎯 Success after retries' ]
```

## 🧠 Example: Mixed Task Types in a Single Pool
You can mix different kinds of tasks seamlessly — the pool handles them polymorphically.

```ts
import {
  AsyncPool,
  Task,
  RetryableTask,
  TimedTask,
  RetryableTimedTask,
  ExponentialBackoffStrategy,
} from 'async-pooler'

const pool = new AsyncPool(3, {
  retryStrategy: new ExponentialBackoffStrategy(2, 50),
  onProgress: (done, total) => console.log(`Progress: ${done}/${total}`),
})

pool.add(new Task('plain', async () => 'Plain done'))
pool.add(new RetryableTask('retryable', async () => 'Retry ok'))
pool.add(new TimedTask('fast', async () => 'Fast done', 500))
pool.add(new RetryableTimedTask('hybrid', async () => 'Hybrid ok', 1000))

const results = await pool.runAll()
console.log(results)
```
### Example output:

```
Progress: 1/4
Progress: 2/4
...
[ 'Plain done', 'Retry ok', 'Fast done', 'Hybrid ok' ]
```

## 🧪 Testing

```bash
# Run tests with Bun
bun run test
# Or with npm
npm test
```

Uses Vitest for fast and isolated unit tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👤 Author

Developed and maintained by [Pere Muñoz](https://your-website.com).

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests on GitHub.
Feel free to fork the repository and submit your improvements.

## 📬 Contact

For any inquiries, please contact [your-email@example.com](mailto:your-email@example.com).

Built for developers who need control and elegance when running async workloads.
Simple enough for scripts, powerful enough for servers.
