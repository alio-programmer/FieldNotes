export default function Toast({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-[25px] left-1/2 rounded bg-[#344433] px-4 py-[11px] font-sans text-[11px] text-white shadow-[0_8px_30px_#1e281e2b] transition ${
        message
          ? 'translate-x-[-50%] translate-y-0 opacity-100'
          : 'pointer-events-none translate-x-[-50%] translate-y-[15px] opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
