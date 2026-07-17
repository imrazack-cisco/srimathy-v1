interface AIStatusProps {
  provider: string;
  model: string;
  latency: number;
  fallback: boolean;
}

export default function AIStatus({
  provider,
  model,
  latency,
  fallback,
}: AIStatusProps) {
  return (
    <div className="fixed top-4 right-4 z-50 rounded-xl border border-gray-200 bg-white p-4 shadow-xl text-sm">
      <div className="font-semibold">
        🤖 {provider}
      </div>

      <div className="text-gray-600">
        🧠 {model}
      </div>

      <div className="text-gray-600">
        ⚡ {latency} ms
      </div>

      {fallback && (
        <div className="mt-2 rounded bg-yellow-100 px-2 py-1 text-yellow-800">
          Fallback Active
        </div>
      )}
    </div>
  );
}