
export default function ErrorMessage({
  message,
}: {
  message: string;
}) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-md bg-red-50 p-3 text-sm text-red-700"
    >
      {message}
    </p>
  );
}
