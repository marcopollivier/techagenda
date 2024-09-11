type CounterProps = {
  count: number
  increment: () => void
}

export const Counter = ({ count, increment }: CounterProps) => (
  <button
    onClick={increment}
    className="text-white bg-zinc-900 py-2.5 px-4 border-2 border-transparent hover:border-sky-500 rounded-md"
  >
    Count is {count}
  </button>
)
