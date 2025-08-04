import React, { useState } from 'react';
import Matrix3DCanvas from '@/components/matrix/Matrix3DCanvas';
import MatrixHUD from '@/components/matrix/MatrixHUD';
import MatrixRain2D_V1 from '@/components/matrix/MatrixRain2D_V1';
import MatrixRain2D_V2 from '@/components/matrix/MatrixRain2D_V2';
import MatrixRain2D_V3 from '@/components/matrix/MatrixRain2D_V3';
import MatrixRain2D_V4 from '@/components/matrix/MatrixRain2D_V4';

const Index = () => {
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [show3D, setShow3D] = useState<boolean>(false);

  const renderMatrixVersion = () => {
    switch (currentVersion) {
      case 1: return <MatrixRain2D_V1 />;
      case 2: return <MatrixRain2D_V2 />;
      case 3: return <MatrixRain2D_V3 />;
      case 4: return <MatrixRain2D_V4 />;
      default: return <MatrixRain2D_V1 />;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Version Controls */}
      <div className="absolute top-4 left-4 z-50 space-y-2">
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map(version => (
            <button
              key={version}
              onClick={() => setCurrentVersion(version)}
              className={`px-3 py-1 text-sm font-mono border border-matrix-green transition-colors ${
                currentVersion === version 
                  ? 'bg-matrix-green text-matrix-background' 
                  : 'bg-matrix-background text-matrix-green hover:bg-matrix-green/20'
              }`}
            >
              V{version}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShow3D(!show3D)}
          className={`px-3 py-1 text-sm font-mono border border-matrix-green transition-colors ${
            show3D 
              ? 'bg-matrix-green text-matrix-background' 
              : 'bg-matrix-background text-matrix-green hover:bg-matrix-green/20'
          }`}
        >
          {show3D ? 'Show 2D' : 'Show 3D'}
        </button>
      </div>

      {show3D ? (
        <>
          {/* 3D Matrix Background */}
          <Matrix3DCanvas />
          {/* Matrix HUD Overlay */}
          <MatrixHUD />
        </>
      ) : (
        <>
          {/* 2D Matrix Rain Versions */}
          {renderMatrixVersion()}
          {/* Matrix HUD Overlay */}
          <MatrixHUD />
        </>
      )}
    </div>
  );
};

export default Index;
