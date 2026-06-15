import CreateFop from "../../imports/CreateFop1/index";

export function CreateFopPage() {
  return (
    <div
      className="w-full overflow-x-auto bg-[#e9ecef]"
      style={{ fontFamily: "'Roboto', sans-serif", minHeight: '100vh' }}
    >
      <div style={{ minWidth: 1440, position: 'relative', height: 936 }}>
        <CreateFop />
      </div>
    </div>
  );
}
