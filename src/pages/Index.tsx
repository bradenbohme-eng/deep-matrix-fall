import React from 'react';
import Matrix3DCanvas from '@/components/matrix/Matrix3DCanvas';
import MatrixHUD from '@/components/matrix/MatrixHUD';

const Index = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* 3D Matrix Background */}
      <Matrix3DCanvas />
      
      {/* Matrix HUD Overlay */}
      <MatrixHUD />
    </div>
  );
};

export default Index;
