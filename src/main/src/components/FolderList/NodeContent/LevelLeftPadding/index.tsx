export default function LevelLeftPadding({ level }: { level: number }) {
  return <div style={{ marginLeft: -8 + level * 8 }} />;
}
