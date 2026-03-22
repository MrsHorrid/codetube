// Placeholder - full implementation coming from another agent
import { RecordingFile } from '@/types/recording';

interface RecordingCaptureProps {
  onSaved?: (rec: RecordingFile) => void;
}

export function RecordingCapture({ onSaved: _onSaved }: RecordingCaptureProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Recording Studio</h2>
      <p className="text-gray-400">Recording capture system is being built...</p>
      <div className="mt-4 text-sm text-gray-500">Check back in a few minutes!</div>
    </div>
  );
}
