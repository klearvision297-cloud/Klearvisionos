export default function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "4px solid #E2E8F0",
          borderTop: "4px solid #2563EB",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
}