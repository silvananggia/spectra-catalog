import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Skeleton from '../components/Skeleton';

// Use lazy for importing your components
const Catalog = lazy(() => import('../components/Catalog'));
const HowToUse = lazy(() => import('../components/HowToUse'));

// Loading component with skeleton
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    gap: '1rem'
  }}>
    <Skeleton variant="circle" width={60} height={60} />
    <Skeleton variant="text" width={200} height={20} />
  </div>
);

function MyRouter() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/how-to-use" element={<HowToUse />} />
      </Routes>
    </Suspense>
  );
}

export default MyRouter;

